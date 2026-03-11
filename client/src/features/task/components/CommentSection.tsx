import { useEffect, useState, useCallback } from "react";
import { Loader2, MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/app/hooks";
import type { CommentResponse } from "@/types/api";
import { useLazyGetCommentsQuery } from "../api/commentApi";
import { useGetMembersQuery } from "@/features/project/api/projectMemberApi";
import { useGetCurrentUserRoleQuery } from "@/features/project/api/projectApi";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";

const PAGE_LIMIT = 20;

interface CommentSectionProps {
  taskId: number;
  projectId: number;
}

export function CommentSection({ taskId, projectId }: CommentSectionProps) {
  const currentUserId = useAppSelector((s) => s.user.currentUser?.id ?? 0);

  const { data: membersData } = useGetMembersQuery(projectId);
  const members = membersData?.data ?? [];

  const { data: roleData } = useGetCurrentUserRoleQuery(projectId);
  const isManager = roleData?.data === "MANAGER";

  // ── Paginated comment state ──────────────────────────────────────────────
  const [allComments, setAllComments] = useState<CommentResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);

  const [fetchComments, { isFetching }] = useLazyGetCommentsQuery();

  // Load (or reload) from page 1
  const loadInitial = useCallback(async () => {
    try {
      const result = await fetchComments(
        { taskId, limit: PAGE_LIMIT },
        /* preferCacheValue */ true,
      ).unwrap();
      setAllComments(result.data);
      setHasMore(result.data.length >= PAGE_LIMIT);
      setNextCursor(
        result.data.length > 0
          ? result.data[result.data.length - 1].id
          : undefined,
      );
    } catch {
      /* errors are handled by RTK Query's error state */
    }
  }, [taskId, fetchComments]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Append the next page
  async function loadMore() {
    if (!nextCursor || isFetching) return;
    try {
      const result = await fetchComments(
        { taskId, cursor: nextCursor, limit: PAGE_LIMIT },
        /* preferCacheValue */ false,
      ).unwrap();
      setAllComments((prev) => [...prev, ...result.data]);
      setHasMore(result.data.length >= PAGE_LIMIT);
      setNextCursor(
        result.data.length > 0
          ? result.data[result.data.length - 1].id
          : undefined,
      );
    } catch {
      /* silent */
    }
  }

  // ── Group into top-level + reply map ─────────────────────────────────────
  const topLevel = allComments.filter((c) => c.parentCommentId === null);
  const repliesMap = allComments
    .filter((c) => c.parentCommentId !== null)
    .reduce<Record<number, CommentResponse[]>>((acc, c) => {
      const key = c.parentCommentId!;
      acc[key] = [...(acc[key] ?? []), c];
      return acc;
    }, {});

  return (
    <Card className="space-y-4 p-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Comments
          {allComments.length > 0 && (
            <span className="ml-1 text-muted-foreground">
              ({allComments.length}{hasMore ? "+" : ""})
            </span>
          )}
        </span>
      </div>

      <Separator />

      {/* ── New comment input ── */}
      <CommentInput
        taskId={taskId}
        members={members}
        onSuccess={() => {
          // Force refetch from start so the new comment appears
          fetchComments({ taskId, limit: PAGE_LIMIT }, false)
            .unwrap()
            .then((result) => {
              setAllComments(result.data);
              setHasMore(result.data.length >= PAGE_LIMIT);
              setNextCursor(
                result.data.length > 0
                  ? result.data[result.data.length - 1].id
                  : undefined,
              );
            })
            .catch(() => {/* silent */});
        }}
      />

      {/* ── Comment list ── */}
      {isFetching && allComments.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : topLevel.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-5">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap[comment.id] ?? []}
              taskId={taskId}
              projectId={projectId}
              currentUserId={currentUserId}
              isManager={isManager}
              members={members}
              onMutate={loadInitial}
            />
          ))}

          {/* ── Load more ── */}
          {hasMore && (
            <div className="flex justify-center pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={isFetching}
              >
                {isFetching && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Load more comments
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
