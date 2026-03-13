import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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

  const { data: membersData } = useGetMembersQuery(
    { projectId, page: 0, size: 100 },
  );
  const members = membersData?.data?.data ?? [];

  const { data: roleData } = useGetCurrentUserRoleQuery(projectId);
  const isManager = roleData?.data === "MANAGER";

  // ── Deep-link: highlight a specific comment from notification ────────────
  const [searchParams] = useSearchParams();
  const targetCommentId = useMemo(() => {
    const raw = searchParams.get("commentId");
    return raw ? Number(raw) : null;
  }, [searchParams]);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  // Prevents firing multiple concurrent "chase" fetches
  const chasingRef = useRef(false);

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

  // ── Chase target comment: keep loading pages until it's visible ──────────
  useEffect(() => {
    if (!targetCommentId) return;
    const found = allComments.some((c) => c.id === targetCommentId);
    if (found) {
      setHighlightedCommentId(targetCommentId);
      chasingRef.current = false;
      return;
    }
    if (hasMore && !isFetching && !chasingRef.current && nextCursor !== undefined) {
      chasingRef.current = true;
      fetchComments({ taskId, cursor: nextCursor, limit: PAGE_LIMIT }, false)
        .unwrap()
        .then((result) => {
          setAllComments((prev) => [...prev, ...result.data]);
          setHasMore(result.data.length >= PAGE_LIMIT);
          setNextCursor(
            result.data.length > 0
              ? result.data[result.data.length - 1].id
              : undefined,
          );
          chasingRef.current = false;
        })
        .catch(() => { chasingRef.current = false; });
    }
  }, [targetCommentId, allComments, hasMore, isFetching, nextCursor, taskId, fetchComments]);

  // ── Clear highlight when user clicks anywhere ────────────────────────────
  useEffect(() => {
    if (!highlightedCommentId) return;
    // Defer so the navigation click itself doesn't immediately clear the highlight
    const setup = setTimeout(() => {
      function onDocClick() {
        setHighlightedCommentId(null);
      }
      document.addEventListener("click", onDocClick, { capture: true, once: true });
      // cleanup in case component unmounts before user clicks
      return () => document.removeEventListener("click", onDocClick, true);
    }, 400);
    return () => clearTimeout(setup);
  }, [highlightedCommentId]);

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
              highlightedCommentId={highlightedCommentId}
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
