import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  CornerDownLeft,
  Smile,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { CommentResponse, ProjectMember, UserSummaryResponse } from "@/types/api";
import {
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useUpdateReactionMutation,
  useLazyGetReactionUsersQuery,
} from "../api/commentApi";
import { CommentInput } from "./CommentInput";

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ["👍", "❤️", "😂", "✅", "🔥", "👎"];

/** Parse all @tag tokens in `text` and return matching member user IDs. */
function extractMentionIds(text: string, members: ProjectMember[]): number[] {
  const tags = new Set(
    [...text.matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase()),
  );
  return members
    .filter((m) => {
      const display = m.user.fullName
        ? m.user.fullName.replace(/\s+/g, "").toLowerCase()
        : m.user.email.split("@")[0].toLowerCase();
      return tags.has(display);
    })
    .map((m) => m.user.id);
}

// ─── Avatar helper ────────────────────────────────────────────────────────────
function UserAvatar({
  user,
  size = "sm",
}: {
  user: Pick<UserSummaryResponse, "fullName" | "email" | "avatarUrl">;
  size?: "xs" | "sm";
}) {
  const sizeClass = size === "xs" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  const initial = (user.fullName ?? user.email).charAt(0).toUpperCase();
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={cn(sizeClass, "shrink-0 rounded-full object-cover")}
      />
    );
  }
  return (
    <div
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
      )}
    >
      {initial}
    </div>
  );
}

// ─── Single reaction button with hover tooltip ───────────────────────────────
function ReactionButton({
  commentId,
  icon,
  count,
  isActive,
  onClick,
}: {
  commentId: number;
  icon: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [fetchUsers, { data: usersData, isFetching }] = useLazyGetReactionUsersQuery();

  function handleMouseEnter() {
    setHovered(true);
    fetchUsers({ commentId, icon }, /* preferCacheValue */ true);
  }

  const users = usersData?.data ?? [];

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all duration-150",
          isActive
            ? "border-primary/40 bg-primary/10 text-primary shadow-sm scale-105"
            : "border-border bg-muted/50 text-foreground hover:bg-muted hover:scale-105",
        )}
      >
        <span className="text-sm leading-none">{icon}</span>
        <span className="font-medium tabular-nums">{count}</span>
      </button>

      {/* Hover tooltip — user list like Facebook */}
      {hovered && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2">
          <div className="min-w-[120px] rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
            <div className="mb-1.5 flex items-center justify-center gap-1">
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-xs font-medium text-foreground">{count}</span>
            </div>
            {isFetching ? (
              <p className="text-center text-[10px] text-muted-foreground">...</p>
            ) : (
              <ul className="space-y-1">
                {users.slice(0, 8).map((u) => (
                  <li key={u.id} className="flex items-center gap-1.5">
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="h-4 w-4 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-semibold text-primary">
                        {(u.fullName ?? u.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[120px] truncate whitespace-nowrap text-[11px] text-foreground">
                      {u.fullName ?? u.email}
                    </span>
                  </li>
                ))}
                {users.length > 8 && (
                  <li className="text-center text-[10px] text-muted-foreground">
                    +{users.length - 8} người khác
                  </li>
                )}
              </ul>
            )}
          </div>
          {/* Arrow */}
          <div className="mx-auto h-2 w-2 -translate-y-px rotate-45 border-b border-r border-border bg-card" />
        </div>
      )}
    </div>
  );
}

// ─── Emoji picker + reactions row ────────────────────────────────────────────
function ReactionBar({
  commentId,
  reactions,
  myCurrentReaction,
  onToggle,
}: {
  commentId: number;
  reactions: Record<string, number>;
  myCurrentReaction: string | null;
  onToggle: (icon: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactionEntries = Object.entries(reactions).filter(([, count]) => count > 0);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {reactionEntries.map(([icon, count]) => (
        <ReactionButton
          key={icon}
          commentId={commentId}
          icon={icon}
          count={count}
          isActive={myCurrentReaction === icon}
          onClick={() => onToggle(icon)}
        />
      ))}

      {/* Emoji picker trigger */}
      <div className="relative">
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            reactionEntries.length === 0 && "opacity-0 group-hover:opacity-100",
            myCurrentReaction && "opacity-100",
          )}
          title={myCurrentReaction ? `Đổi reaction (hiện tại: ${myCurrentReaction})` : "Thêm reaction"}
        >
          {myCurrentReaction ? (
            <span className="text-sm leading-none">{myCurrentReaction}</span>
          ) : (
            <Smile className="h-3.5 w-3.5" />
          )}
        </button>

        {pickerOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setPickerOpen(false)}
            />
            <div className="absolute bottom-full left-0 z-50 mb-1 rounded-lg border border-border bg-card p-1.5 shadow-md">
              <p className="mb-1 px-1 text-[10px] text-muted-foreground">
                {myCurrentReaction ? "Đổi reaction" : "Chọn reaction"}
              </p>
              <div className="flex gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className={cn(
                      "rounded p-1 text-base transition-colors hover:bg-accent",
                      myCurrentReaction === emoji && "bg-primary/10 ring-1 ring-primary/30",
                    )}
                    onClick={() => {
                      onToggle(emoji);
                      setPickerOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CommentItemProps {
  comment: CommentResponse;
  /** Top-level replies grouped under this comment */
  replies?: CommentResponse[];
  taskId: number;
  projectId: number;
  currentUserId: number;
  /** Project MANAGER can delete any comment */
  isManager: boolean;
  members: ProjectMember[];
  /** Called after any mutation so parent can refresh the comment list */
  onMutate: () => void;
  /** Render as an indented reply (no nesting further down) */
  isReply?: boolean;
  /** ID of the comment to highlight (from notification deep-link) */
  highlightedCommentId?: number | null;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function CommentItem({
  comment,
  replies = [],
  taskId,
  projectId,
  currentUserId,
  isManager,
  members,
  onMutate,
  isReply = false,
  highlightedCommentId,
}: CommentItemProps) {
  const isOwner = comment.user.id === currentUserId;
  const canEdit = isOwner;
  const canDelete = isOwner || isManager;
  const isHighlighted = highlightedCommentId === comment.id;

  // Ref used for scroll-into-view when highlighted
  const commentRef = useRef<HTMLDivElement>(null);

  // Scroll into view when this comment becomes highlighted
  useEffect(() => {
    if (!isHighlighted || !commentRef.current) return;
    const t = setTimeout(() => {
      commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(t);
  }, [isHighlighted]);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  // Auto-expand replies if the highlighted comment is one of our replies
  const [showReplies, setShowReplies] = useState(
    () => replies.some((r) => r.id === highlightedCommentId),
  );
  const [replying, setReplying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Optimistic local reactions map (icon → count)
  const [localReactions, setLocalReactions] = useState<Record<string, number>>(
    () => ({ ...comment.reactions }),
  );
  // Only ONE reaction per user at a time
  const [myCurrentReaction, setMyCurrentReaction] = useState<string | null>(null);

  // Sync localReactions when the API cache refreshes the prop
  const prevReactionsRef = useRef(comment.reactions);
  if (prevReactionsRef.current !== comment.reactions) {
    prevReactionsRef.current = comment.reactions;
    setLocalReactions({ ...comment.reactions });
  }

  const [updateComment, { isLoading: isUpdating }] = useUpdateCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();
  const [addReaction] = useAddReactionMutation();
  const [removeReaction] = useRemoveReactionMutation();
  const [updateReaction] = useUpdateReactionMutation();

  // ── Edit handlers ──────────────────────────────────────────────────────────
  async function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setEditing(false);
      return;
    }
    const mentionUserIds = extractMentionIds(trimmed, members);
    try {
      await updateComment({
        commentId: comment.id,
        taskId,
        content: trimmed,
        ...(mentionUserIds.length > 0 ? { mentionUserIds } : {}),
      }).unwrap();
      setEditing(false);
      onMutate();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update comment"));
    }
  }

  // ── Delete handler ─────────────────────────────────────────────────────────
  async function handleDelete() {
    try {
      await deleteComment({ commentId: comment.id, taskId }).unwrap();
      setConfirmDelete(false);
      onMutate();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete comment"));
    }
  }

  // ── Reaction handler: one reaction per user ──────────────────────────────
  function handleToggleReaction(icon: string) {
    const prev = myCurrentReaction;

    if (prev === icon) {
      // ── Case 1: same icon → remove ───────────────────────────────────
      setMyCurrentReaction(null);
      setLocalReactions((r) => ({ ...r, [icon]: Math.max(0, (r[icon] ?? 1) - 1) }));

      removeReaction({ commentId: comment.id, taskId, icon })
        .unwrap()
        .catch((err) => {
          setMyCurrentReaction(icon);
          setLocalReactions((r) => ({ ...r, [icon]: (r[icon] ?? 0) + 1 }));
          toast.error(getApiErrorMessage(err, "Failed to remove reaction"));
        });
    } else if (!prev) {
      // ── Case 2: no prior reaction → add ─────────────────────────────
      setMyCurrentReaction(icon);
      setLocalReactions((r) => ({ ...r, [icon]: (r[icon] ?? 0) + 1 }));

      addReaction({ commentId: comment.id, taskId, icon })
        .unwrap()
        .catch((err) => {
          setMyCurrentReaction(null);
          setLocalReactions((r) => ({ ...r, [icon]: Math.max(0, (r[icon] ?? 1) - 1) }));
          toast.error(getApiErrorMessage(err, "Failed to add reaction"));
        });
    } else {
      // ── Case 3: different icon → PATCH upsert (atomic switch) ─────────
      setMyCurrentReaction(icon);
      setLocalReactions((r) => ({
        ...r,
        [prev]: Math.max(0, (r[prev] ?? 1) - 1),
        [icon]: (r[icon] ?? 0) + 1,
      }));

      updateReaction({ commentId: comment.id, taskId, icon })
        .unwrap()
        .catch((err) => {
          // Rollback
          setMyCurrentReaction(prev);
          setLocalReactions((r) => ({
            ...r,
            [icon]: Math.max(0, (r[icon] ?? 1) - 1),
            [prev]: (r[prev] ?? 0) + 1,
          }));
          toast.error(getApiErrorMessage(err, "Failed to switch reaction"));
        });
    }
  }

  // ── Relative timestamp ────────────────────────────────────────────────────
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  const absoluteTime = (() => {
    try {
      return new Date(comment.createdAt).toLocaleString();
    } catch {
      return "";
    }
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={commentRef}
      className={cn(
        "group rounded-lg transition-shadow duration-300",
        isHighlighted && "ring-2 ring-primary shadow-sm",
      )}
    >
      <div className="flex gap-3">
        <UserAvatar user={comment.user} size={isReply ? "xs" : "sm"} />

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* ── Header ── */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.user.fullName ?? comment.user.email}
            </span>
            <span
              title={absoluteTime}
              className="text-xs text-muted-foreground"
            >
              {timeAgo}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}

            {/* Hover actions */}
            {!editing && !confirmDelete && (canEdit || canDelete || !isReply) && (
              <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!isReply && (
                  <button
                    onClick={() => {
                      setReplying(true);
                      setShowReplies(true);
                    }}
                    className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <CornerDownLeft className="h-3.5 w-3.5" />
                    Reply
                  </button>
                )}

                {(canEdit || canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      {canEdit && (
                        <DropdownMenuItem
                          onClick={() => {
                            setEditContent(comment.content);
                            setEditing(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmDelete(true)}
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* ── Content or Edit form ── */}
          {editing ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditing(false);
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    handleSaveEdit();
                  }
                }}
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                >
                  {isUpdating && (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {comment.content}
            </p>
          )}

          {/* ── Inline delete confirm ── */}
          {confirmDelete && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs">
              <span className="text-destructive">Delete this comment?</span>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 text-xs"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* ── Reactions ── */}
          {!editing && !confirmDelete && (
            <ReactionBar
              commentId={comment.id}
              reactions={localReactions}
              myCurrentReaction={myCurrentReaction}
              onToggle={handleToggleReaction}
            />
          )}
        </div>
      </div>

      {/* ── Replies section (top-level comments only) ── */}
      {!isReply && (replies.length > 0 || replying) && (
        <div className="ml-11 mt-3 space-y-3 border-l-2 border-border pl-4">
          {/* Show/hide replies toggle */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showReplies ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {showReplies ? "Hide" : "Show"} {replies.length}{" "}
              {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}

          {/* Reply items */}
          {showReplies &&
            replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                taskId={taskId}
                projectId={projectId}
                currentUserId={currentUserId}
                isManager={isManager}
                members={members}
                onMutate={onMutate}
                isReply
                highlightedCommentId={highlightedCommentId}
              />
            ))}

          {/* Reply input */}
          {replying && (
            <CommentInput
              taskId={taskId}
              parentCommentId={comment.id}
              members={members}
              autoFocus
              replyingToName={comment.user.fullName ?? comment.user.email}
              onSuccess={() => {
                setReplying(false);
                setShowReplies(true);
                onMutate();
              }}
              onCancel={() => setReplying(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
