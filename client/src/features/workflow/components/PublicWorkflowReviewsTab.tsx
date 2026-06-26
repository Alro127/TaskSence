import { formatDistanceToNow } from "date-fns";
import { ChevronUp, Loader2, MessageSquare, Reply, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/utils";
import type { WorkflowCommentResponse } from "@/types/api";

import {
  useCreateWorkflowCommentMutation,
  useDeleteWorkflowCommentMutation,
  useLazyGetWorkflowCommentReactionUsersQuery,
  useLazyGetWorkflowCommentsQuery,
  useLazyGetWorkflowCommentRepliesQuery,
  useRemoveWorkflowCommentReactionMutation,
  useUpdateWorkflowCommentMutation,
  useUpdateWorkflowCommentReactionMutation,
} from "../api/workflowCommentApi";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "✅", "🎯"];
const PAGE_LIMIT = 15;
const REPLIES_LIMIT = 10;

interface PublicWorkflowReviewsTabProps {
  workflowId: number;
}

function getDisplayName(comment: WorkflowCommentResponse): string {
  return comment.user.fullName ?? comment.user.email;
}

function getInitial(comment: WorkflowCommentResponse): string {
  return getDisplayName(comment).charAt(0).toUpperCase();
}

function formatTime(value: string): string {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return "just now";
  }
}

interface ReactionBadgeProps {
  commentId: number;
  icon: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function ReactionBadge({ commentId, icon, count, isActive, onClick }: ReactionBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [fetchUsers, { data, isFetching }] = useLazyGetWorkflowCommentReactionUsersQuery();

  const users = data?.data ?? [];

  const handleMouseEnter = () => {
    setIsHovered(true);
    void fetchUsers({ commentId, icon }, true);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
          isActive
            ? "bg-[rgba(35,58,135,0.1)] text-[#233a87]"
            : "bg-[#f4f3f1] text-[#444651]"
        }`}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span>{icon}</span>
        <span className="font-semibold">{count}</span>
      </button>

      {isHovered && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-md border border-[rgba(197,197,211,0.35)] bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.09)]">
          <p className="mb-1 text-xs font-semibold text-[#1a1c1b]">
            {icon} {count} reaction{count !== 1 ? "s" : ""}
          </p>
          {isFetching ? (
            <p className="text-xs text-[#444651]">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-[#444651]">No users found</p>
          ) : (
            <ul className="space-y-1">
              {users.slice(0, 6).map((user) => (
                <li key={user.id} className="truncate text-xs text-[#444651]">
                  {user.fullName ?? user.email}
                </li>
              ))}
              {users.length > 6 && (
                <li className="text-xs text-[#444651]">+{users.length - 6} more</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: WorkflowCommentResponse;
  isReply?: boolean;
  currentUserId: number | null;
  isAuthenticated: boolean;
  onCommentAction: () => void;
  workflowId: number;
  handleToggleReaction: (commentId: number, icon: string) => Promise<void>;
  myReactions: Record<number, string>;
  editingCommentId: number | null;
  setEditingCommentId: (id: number | null) => void;
  editingContent: string;
  setEditingContent: (content: string) => void;
  handleUpdateComment: (commentId: number) => Promise<void>;
  isUpdatingComment: boolean;
  handleDeleteComment: (commentId: number) => Promise<void>;
  isDeletingComment: boolean;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handlePostReply: (parentCommentId: number, mentionUserId?: number) => Promise<WorkflowCommentResponse | undefined>;
  isCreatingComment: boolean;
  handleRequireAuth: () => void;
  rootId?: number;
  onReplyPosted?: (newComment: WorkflowCommentResponse) => void;
}

function CommentItem({
  comment,
  isReply = false,
  currentUserId,
  isAuthenticated,
  onCommentAction,
  workflowId,
  handleToggleReaction,
  myReactions,
  editingCommentId,
  setEditingCommentId,
  editingContent,
  setEditingContent,
  handleUpdateComment,
  isUpdatingComment,
  handleDeleteComment,
  isDeletingComment,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  handlePostReply,
  isCreatingComment,
  handleRequireAuth,
  rootId,
  onReplyPosted,
}: CommentItemProps) {
  // Use the provided rootId, or the current comment's id if it's a top-level comment
  const activeRootId = rootId ?? comment.id;

  const [replies, setReplies] = useState<WorkflowCommentResponse[]>([]);
  const [isRepliesLoaded, setIsRepliesLoaded] = useState(false);
  const [isRepliesVisible, setIsRepliesVisible] = useState(false);
  const [repliesCursor, setRepliesCursor] = useState<number | undefined>(undefined);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  
  const [fetchReplies, { isFetching: isFetchingReplies }] = useLazyGetWorkflowCommentRepliesQuery();

  const handleLoadReplies = async (initial = false) => {
    try {
      const result = await fetchReplies({
        commentId: activeRootId,
        cursor: initial ? undefined : repliesCursor,
        limit: REPLIES_LIMIT
      }, false).unwrap();
      
      if (initial) {
        setReplies(result.data);
        setIsRepliesLoaded(true);
      } else {
        setReplies(prev => {
          const combined = [...prev, ...result.data];
          return combined
            .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      }
      
      setHasMoreReplies(result.data.length >= REPLIES_LIMIT);
      if (result.data.length > 0) {
        setRepliesCursor(result.data[result.data.length - 1].id);
      }
      setIsRepliesVisible(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load replies."));
    }
  };

  const handleReplyPostedLocal = (newComment: WorkflowCommentResponse) => {
    const sortFn = (a: WorkflowCommentResponse, b: WorkflowCommentResponse) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    if (!isRepliesLoaded) {
      void handleLoadReplies(true).then(() => {
        setReplies(prev => {
          if (prev.some(c => c.id === newComment.id)) return prev;
          return [...prev, newComment].sort(sortFn);
        });
        setIsRepliesVisible(true);
      });
    } else {
      setReplies(prev => {
        if (prev.some(c => c.id === newComment.id)) return prev;
        return [...prev, newComment].sort(sortFn);
      });
      setIsRepliesVisible(true);
    }
  };

  const isOwner = comment.user.id === currentUserId;

  return (
    <div className={`group/comment ${isReply ? "mt-4" : ""}`}>
      <div className="flex gap-3">
        <div className={`flex shrink-0 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)] font-bold text-[#233a87] ${isReply ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"}`}>
          {getInitial(comment)}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`${isReply ? "text-xs" : "text-sm"} font-semibold text-[#1a1c1b]`}>{getDisplayName(comment)}</h3>
            <span className="text-xs text-[#444651]">{formatTime(comment.createdAt)}</span>
            {comment.isEdited && <span className="text-xs text-[#444651]">(edited)</span>}
          </div>

          {editingCommentId === comment.id ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={editingContent}
                onChange={(event) => setEditingContent(event.target.value)}
                className="w-full resize-none rounded-md border border-[rgba(197,197,211,0.35)] bg-[#faf9f7] px-3 py-2 text-sm text-[#1a1c1b] focus:outline-none focus:ring-2 focus:ring-[rgba(35,58,135,0.2)]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[#233a87] text-white hover:opacity-90"
                  disabled={isUpdatingComment || !editingContent.trim()}
                  onClick={() => void handleUpdateComment(comment.id).then(onCommentAction)}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className={`${isReply ? "text-xs" : "text-sm"} leading-relaxed text-[#444651]`}>{comment.content}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(comment.reactions)
              .filter(([, count]) => count > 0)
              .map(([icon, count]) => (
                <ReactionBadge
                  key={`${comment.id}-${icon}`}
                  commentId={comment.id}
                  icon={icon}
                  count={count}
                  isActive={myReactions[comment.id] === icon}
                  onClick={() => void handleToggleReaction(comment.id, icon).then(onCommentAction)}
                />
              ))}

            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={`${comment.id}-quick-${emoji}`}
                type="button"
                className="rounded-md border border-[rgba(197,197,211,0.35)] bg-white px-2 py-1 text-xs text-[#444651] hover:bg-[#f4f3f1]"
                onClick={() => void handleToggleReaction(comment.id, emoji).then(onCommentAction)}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              className="inline-flex items-center gap-1 font-semibold text-[#233a87] hover:underline"
              onClick={() => {
                if (!isAuthenticated) {
                  handleRequireAuth();
                  return;
                }
                setReplyingTo(comment.id);
                setReplyContent("");
              }}
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>

            {isOwner && editingCommentId !== comment.id && (
              <button
                type="button"
                className="font-semibold text-[#444651] hover:text-[#233a87]"
                onClick={() => {
                  setEditingCommentId(comment.id);
                  setEditingContent(comment.content);
                }}
              >
                Edit
              </button>
            )}

            {isOwner && (
              <button
                type="button"
                className="inline-flex items-center gap-1 font-semibold text-[#ba1a1a] hover:underline"
                disabled={isDeletingComment}
                onClick={() => void handleDeleteComment(comment.id).then(onCommentAction)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="rounded-md border border-[rgba(197,197,211,0.35)] bg-[#faf9f7] p-3">
              <textarea
                rows={2}
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder={`Reply to ${getDisplayName(comment)}`}
                className="w-full resize-none rounded-md border border-[rgba(197,197,211,0.35)] bg-white px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#444651] focus:outline-none focus:ring-2 focus:ring-[rgba(35,58,135,0.2)]"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[#233a87] text-white hover:opacity-90"
                  disabled={isCreatingComment || !replyContent.trim()}
                  onClick={() => {
                    // Always use activeRootId as the parent for flat threading
                    void handlePostReply(activeRootId, comment.user.id).then((newComment) => {
                      if (newComment) {
                        if (isReply && onReplyPosted) {
                          onReplyPosted(newComment);
                        } else {
                          handleReplyPostedLocal(newComment);
                        }
                      }
                    });
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  Reply
                </Button>
              </div>
            </div>
          )}

          {!isReply && (comment.replyCount > 0 || replies.length > 0) && (
            <div className="mt-2">
              {!isRepliesVisible ? (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-bold text-[#233a87] hover:underline"
                  onClick={() => !isRepliesLoaded ? void handleLoadReplies(true) : setIsRepliesVisible(true)}
                  disabled={isFetchingReplies}
                >
                  <Reply className="h-3.5 w-3.5 rotate-180" />
                  View {Math.max(comment.replyCount, replies.length)} {Math.max(comment.replyCount, replies.length) === 1 ? "reply" : "replies"}
                  {isFetchingReplies && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
                </button>
              ) : (
                <div className="space-y-4 border-l-2 border-[#efeeec] pl-4">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isReply={true}
                      currentUserId={currentUserId}
                      isAuthenticated={isAuthenticated}
                      onCommentAction={() => {
                        void handleLoadReplies(true);
                      }}
                      onReplyPosted={handleReplyPostedLocal}
                      workflowId={workflowId}
                      handleToggleReaction={handleToggleReaction}
                      myReactions={myReactions}
                      editingCommentId={editingCommentId}
                      setEditingCommentId={setEditingCommentId}
                      editingContent={editingContent}
                      setEditingContent={setEditingContent}
                      handleUpdateComment={handleUpdateComment}
                      isUpdatingComment={isUpdatingComment}
                      handleDeleteComment={handleDeleteComment}
                      isDeletingComment={isDeletingComment}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      handlePostReply={handlePostReply}
                      isCreatingComment={isCreatingComment}
                      handleRequireAuth={handleRequireAuth}
                      rootId={activeRootId}
                    />
                  ))}
                  
                  {hasMoreReplies && (
                    <button
                      type="button"
                      className="text-xs font-bold text-[#444651] hover:text-[#233a87] hover:underline"
                      onClick={() => void handleLoadReplies()}
                      disabled={isFetchingReplies}
                    >
                      Show more replies
                      {isFetchingReplies && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
                    </button>
                  )}

                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-bold text-[#444651] hover:underline"
                    onClick={() => setIsRepliesVisible(false)}
                  >
                    <ChevronUp className="h-3 w-3" />
                    Hide replies
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PublicWorkflowReviewsTab({ workflowId }: PublicWorkflowReviewsTabProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id ?? null);

  const [comments, setComments] = useState<WorkflowCommentResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [myReactions, setMyReactions] = useState<Record<number, string>>({});
  const [sortBy, setSortBy] = useState<"asc" | "desc">("desc");

  const [fetchComments, { isFetching }] = useLazyGetWorkflowCommentsQuery();
  const [createComment, { isLoading: isCreatingComment }] = useCreateWorkflowCommentMutation();
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateWorkflowCommentMutation();
  const [deleteComment, { isLoading: isDeletingComment }] = useDeleteWorkflowCommentMutation();
  const [updateReaction] = useUpdateWorkflowCommentReactionMutation();
  const [removeReaction] = useRemoveWorkflowCommentReactionMutation();

  const loadInitial = useCallback(async () => {
    try {
      const result = await fetchComments({ workflowId, limit: PAGE_LIMIT, sort: sortBy }, false).unwrap();
      setComments(result.data);
      setHasMore(result.data.length >= PAGE_LIMIT);
      setNextCursor(result.data.length > 0 ? result.data[result.data.length - 1].id : undefined);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load workflow comments."));
    }
  }, [fetchComments, workflowId, sortBy]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleRequireAuth = () => {
    toast.error("Please sign in to comment or react.");
    navigate("/auth/login");
  };

  const handlePostComment = async () => {
    const content = newCommentContent.trim();
    if (!content) {
      return;
    }

    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    try {
      await createComment({ workflowId, content }).unwrap();
      setNewCommentContent("");
      await loadInitial();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to post comment."));
    }
  };

  const handlePostReply = async (parentCommentId: number, mentionUserId?: number): Promise<WorkflowCommentResponse | undefined> => {
    const content = replyContent.trim();
    if (!content) {
      return;
    }

    try {
      const mentionUserIds = mentionUserId ? [mentionUserId] : [];

      const result = await createComment({
        workflowId,
        parentCommentId,
        content,
        mentionUserIds,
      }).unwrap();
      setReplyingTo(null);
      setReplyContent("");
      return result.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to post reply."));
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    const content = editingContent.trim();
    if (!content) {
      return;
    }

    try {
      await updateComment({ commentId, workflowId, content }).unwrap();
      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update comment."));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment({ commentId, workflowId }).unwrap();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete comment."));
    }
  };

  const handleToggleReaction = async (commentId: number, icon: string) => {
    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    const currentIcon = myReactions[commentId];

    try {
      if (currentIcon === icon) {
        await removeReaction({ commentId, workflowId, icon }).unwrap();
        setMyReactions((prev) => {
          const clone = { ...prev };
          delete clone[commentId];
          return clone;
        });
      } else {
        await updateReaction({ commentId, workflowId, icon }).unwrap();
        setMyReactions((prev) => ({ ...prev, [commentId]: icon }));
      }
      // Re-fetch only this comment or re-fetch all?
      // Re-fetching all for now
      await loadInitial();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update reaction."));
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isFetching) {
      return;
    }

    try {
      const result = await fetchComments(
        { workflowId, cursor: nextCursor, limit: PAGE_LIMIT, sort: sortBy },
        false,
      ).unwrap();
      setComments((prev) => [...prev, ...result.data]);
      setHasMore(result.data.length >= PAGE_LIMIT);
      setNextCursor(result.data.length > 0 ? result.data[result.data.length - 1].id : undefined);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load more comments."));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#efeeec] py-3">
        <span className="text-sm font-semibold text-[#1a1c1b]">
          {comments.length} top-level comment{comments.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#444651]">Sort by:</span>
          <select 
            className="bg-transparent text-xs font-semibold text-[#1a1c1b] focus:outline-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "asc" | "desc")}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <textarea
          rows={3}
          value={newCommentContent}
          onChange={(event) => setNewCommentContent(event.target.value)}
          placeholder="Add a public comment for this workflow"
          className="w-full resize-none rounded-md border border-[rgba(197,197,211,0.35)] bg-[#faf9f7] px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#444651] focus:outline-none focus:ring-2 focus:ring-[rgba(35,58,135,0.2)]"
        />
        <div className="mt-3 flex justify-end">
          <Button
            className="bg-[#233a87] text-white hover:opacity-90"
            disabled={isCreatingComment || !newCommentContent.trim()}
            onClick={() => void handlePostComment()}
          >
            {isCreatingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Post Comment
          </Button>
        </div>
      </div>

      {isFetching && comments.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#444651]" />
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] p-6 text-center text-sm text-[#444651]">
          No comments yet. Start the discussion for this workflow.
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="ghost-border rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            >
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
                onCommentAction={() => void loadInitial()}
                workflowId={workflowId}
                handleToggleReaction={handleToggleReaction}
                myReactions={myReactions}
                editingCommentId={editingCommentId}
                setEditingCommentId={setEditingCommentId}
                editingContent={editingContent}
                setEditingContent={setEditingContent}
                handleUpdateComment={handleUpdateComment}
                isUpdatingComment={isUpdatingComment}
                handleDeleteComment={handleDeleteComment}
                isDeletingComment={isDeletingComment}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                handlePostReply={handlePostReply}
                isCreatingComment={isCreatingComment}
                handleRequireAuth={handleRequireAuth}
              />
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void handleLoadMore()} disabled={isFetching}>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more comments
          </Button>
        </div>
      )}
    </div>
  );
}
