import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Reply, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  useRemoveWorkflowCommentReactionMutation,
  useUpdateWorkflowCommentMutation,
  useUpdateWorkflowCommentReactionMutation,
} from "../api/workflowCommentApi";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "✅", "🎯"];
const PAGE_LIMIT = 15;

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

  const [fetchComments, { isFetching }] = useLazyGetWorkflowCommentsQuery();
  const [createComment, { isLoading: isCreatingComment }] = useCreateWorkflowCommentMutation();
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateWorkflowCommentMutation();
  const [deleteComment, { isLoading: isDeletingComment }] = useDeleteWorkflowCommentMutation();
  const [updateReaction] = useUpdateWorkflowCommentReactionMutation();
  const [removeReaction] = useRemoveWorkflowCommentReactionMutation();

  const loadInitial = useCallback(async () => {
    try {
      const result = await fetchComments({ workflowId, limit: PAGE_LIMIT }, false).unwrap();
      setComments(result.data);
      setHasMore(result.data.length >= PAGE_LIMIT);
      setNextCursor(result.data.length > 0 ? result.data[result.data.length - 1].id : undefined);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load workflow comments."));
    }
  }, [fetchComments, workflowId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInitial();
  }, [loadInitial]);

  const topLevelComments = useMemo(
    () => comments.filter((comment) => comment.parentCommentId === null),
    [comments],
  );

  const repliesMap = useMemo(
    () =>
      comments
        .filter((comment) => comment.parentCommentId !== null)
        .reduce<Record<number, WorkflowCommentResponse[]>>((acc, comment) => {
          const parentId = comment.parentCommentId as number;
          acc[parentId] = [...(acc[parentId] ?? []), comment];
          return acc;
        }, {}),
    [comments],
  );

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

  const handlePostReply = async (parentCommentId: number) => {
    const content = replyContent.trim();
    if (!content) {
      return;
    }

    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    try {
      await createComment({ workflowId, parentCommentId, content }).unwrap();
      setReplyingTo(null);
      setReplyContent("");
      await loadInitial();
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
      await loadInitial();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update comment."));
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment({ commentId, workflowId }).unwrap();
      await loadInitial();
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
        { workflowId, cursor: nextCursor, limit: PAGE_LIMIT },
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
      <div className="flex items-center justify-between border-y border-[#efeeec] py-3">
        <span className="text-sm font-semibold text-[#1a1c1b]">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-[#444651]">Sorted by newest</span>
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
      ) : topLevelComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] p-6 text-center text-sm text-[#444651]">
          No comments yet. Start the discussion for this workflow.
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => {
            const commentReplies = repliesMap[comment.id] ?? [];
            const isOwner = comment.user.id === currentUserId;

            return (
              <article
                key={comment.id}
                className="ghost-border rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)] text-xs font-bold text-[#233a87]">
                    {getInitial(comment)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#1a1c1b]">{getDisplayName(comment)}</h3>
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
                            onClick={() => void handleUpdateComment(comment.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-[#444651]">{comment.content}</p>
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
                            onClick={() => void handleToggleReaction(comment.id, icon)}
                          />
                        ))}

                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={`${comment.id}-quick-${emoji}`}
                          type="button"
                          className="rounded-md border border-[rgba(197,197,211,0.35)] bg-white px-2 py-1 text-xs text-[#444651] hover:bg-[#f4f3f1]"
                          onClick={() => void handleToggleReaction(comment.id, emoji)}
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
                          onClick={() => void handleDeleteComment(comment.id)}
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
                            onClick={() => void handlePostReply(comment.id)}
                          >
                            <Send className="h-3.5 w-3.5" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    )}

                    {commentReplies.length > 0 && (
                      <div className="space-y-3 border-l-2 border-[#efeeec] pl-4">
                        {commentReplies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)] text-[10px] font-bold text-[#233a87]">
                              {getInitial(reply)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-[#1a1c1b]">{getDisplayName(reply)}</p>
                                <span className="text-xs text-[#444651]">{formatTime(reply.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-sm text-[#444651]">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
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
