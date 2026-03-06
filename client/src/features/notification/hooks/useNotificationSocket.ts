import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  pushRealtimeNotification,
  triggerBellAnimation,
  stopBellAnimation,
} from "../notificationSlice";
import { notificationApi } from "../api/notificationApi";
import type { NotificationSocketMessage } from "@/types/api";
import { getNotificationText } from "../utils/notificationUtils";

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ||
  "ws://localhost:8080/api/v1/ws";

/**
 * Manages a persistent STOMP WebSocket connection for the current user.
 * Subscribes to /user/queue/notifications and dispatches new notifications
 * to Redux state, shows a toast, and triggers the bell animation.
 *
 * Should be mounted once inside MainLayout (always rendered when authenticated).
 */
export function useNotificationSocket() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const clientRef = useRef<Client | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/user/queue/notifications", (frame) => {
          try {
            const message: NotificationSocketMessage = JSON.parse(frame.body);

            // Normalize socket message to NotificationResponse shape
            const notification = {
              ...message,
              read: false, // real-time push is always unread
            };

            // Push to Redux state
            dispatch(pushRealtimeNotification(notification));

            // Invalidate the unread-count RTK Query cache so badge syncs
            dispatch(
              notificationApi.util.invalidateTags(["UnreadCount"])
            );

            // Trigger bell shake animation (auto stop after 1s)
            dispatch(triggerBellAnimation());
            if (animationTimerRef.current) {
              clearTimeout(animationTimerRef.current);
            }
            animationTimerRef.current = setTimeout(() => {
              dispatch(stopBellAnimation());
            }, 1000);

            // Show toast
            const { title, description } = getNotificationText(notification);
            toast(title, {
              description,
              duration: 4000,
            });
          } catch (err) {
            console.error("[useNotificationSocket] Failed to parse message", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("[useNotificationSocket] STOMP error", frame);
      },
      onDisconnect: () => {
        console.log("[useNotificationSocket] Disconnected");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      client.deactivate();
      clientRef.current = null;
    };
    // Re-connect if token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);
}
