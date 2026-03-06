import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  clearUnreadCount,
  decrementUnreadCount,
  markAllRealtimeItemsRead,
  markRealtimeItemRead,
  removeRealtimeItem,
  setUnreadCount,
} from "../notificationSlice";
import {
  useGetUnreadCountQuery,
  useLazyGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
} from "../api/notificationApi";
import { NotificationItem } from "./NotificationItem";
import type { NotificationResponse } from "@/types/api";
import { getNotificationTarget } from "../utils/notificationUtils";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function NotificationDropdown() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const unreadCount = useAppSelector((s) => s.notification.unreadCount);
  const realtimeItems = useAppSelector((s) => s.notification.realtimeItems);
  const bellAnimating = useAppSelector((s) => s.notification.bellAnimating);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch once on mount (= on login, since NotificationDropdown lives inside MainLayout).
  // Refetched automatically when socket pushes a new notification via invalidateTags(["UnreadCount"]).
  const { data: unreadData } = useGetUnreadCountQuery(undefined);

  useEffect(() => {
    if (unreadData?.data !== undefined) {
      dispatch(setUnreadCount(unreadData.data));
    }
  }, [unreadData?.data, dispatch]);

  const [fetchNotifications] = useLazyGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  // ── Fetch first page when dropdown opens ──────────────────────────────────
  const loadFirstPage = useCallback(async () => {
    setIsFetchingMore(true);
    try {
      const result = await fetchNotifications(
        { limit: PAGE_SIZE },
        false
      ).unwrap();
      const fetched = result.data ?? [];
      setItems(fetched);
      setCursor(fetched.length > 0 ? fetched[fetched.length - 1].id : undefined);
      setHasMore(fetched.length === PAGE_SIZE);
    } finally {
      setIsFetchingMore(false);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) {
      loadFirstPage();
    } else {
      // Reset when closed
      setItems([]);
      setCursor(undefined);
      setHasMore(true);
    }
  }, [open, loadFirstPage]);

  // ── Infinite scroll sentinel ───────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const result = await fetchNotifications(
        { cursor, limit: PAGE_SIZE },
        false
      ).unwrap();
      const fetched = result.data ?? [];
      setItems((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = fetched.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });
      if (fetched.length > 0) {
        setCursor(fetched[fetched.length - 1].id);
      }
      setHasMore(fetched.length === PAGE_SIZE);
    } finally {
      setIsFetchingMore(false);
    }
  }, [fetchNotifications, cursor, hasMore, isFetchingMore]);

  useEffect(() => {
    if (!open || !sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [open, loadMore]);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Merge realtime + fetched items (realtime items show at top) ───────────
  const mergedItems = [
    ...realtimeItems.filter((rt) => !items.some((i) => i.id === rt.id)),
    ...items,
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleItemClick = async (notification: NotificationResponse) => {
    // Mark as read optimistically
    if (!notification.read) {
      dispatch(markRealtimeItemRead(notification.id));
      dispatch(decrementUnreadCount());
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      try {
        await markAsRead(notification.id).unwrap();
      } catch {
        // revert would be complex; just ignore — server will reconcile
      }
    }

    // Navigate to context
    const target = getNotificationTarget(notification);
    setOpen(false);
    if (target) {
      navigate(target);
    }
  };

  const handleDelete = async (id: number) => {
    dispatch(removeRealtimeItem(id));
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotification(id).unwrap();
    } catch {
      // keep deleted from UI for now
    }
  };

  const handleMarkAllRead = async () => {
    dispatch(markAllRealtimeItemsRead());
    dispatch(clearUnreadCount());
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllAsRead().unwrap();
    } catch {
      // ignore
    }
  };

  const displayCount = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Button ── */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell
          className={cn(
            "h-5 w-5 transition-colors",
            bellAnimating && "bell-shake text-primary"
          )}
        />
        {displayCount && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow">
            {displayCount}
          </span>
        )}
      </Button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-card shadow-lg sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
              >
                {isMarkingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                Mark all read
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {mergedItems.length === 0 && !isFetchingMore ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground/60">
                  No notifications yet.
                </p>
              </div>
            ) : (
              <div className="py-1">
                {mergedItems.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleItemClick}
                    onDelete={handleDelete}
                  />
                ))}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-1" />

                {/* Loading more indicator */}
                {isFetchingMore && (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!hasMore && mergedItems.length > 0 && (
                  <p className="py-2 text-center text-xs text-muted-foreground/50">
                    You're all caught up
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
