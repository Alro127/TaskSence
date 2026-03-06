import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { NotificationResponse } from "@/types/api";

interface NotificationState {
  // Real-time notifications pushed via WebSocket (newest first)
  realtimeItems: NotificationResponse[];
  // Unread count shown on the bell badge
  unreadCount: number;
  // Triggers shake animation on bell icon
  bellAnimating: boolean;
}

const initialState: NotificationState = {
  realtimeItems: [],
  unreadCount: 0,
  bellAnimating: false,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // Called when WS pushes a new notification
    pushRealtimeNotification(state, action: PayloadAction<NotificationResponse>) {
      const exists = state.realtimeItems.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.realtimeItems.unshift(action.payload);
        state.unreadCount += 1;
      }
    },

    // Sync unread count from REST API on initial load
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },

    // Decrement unread count when a single item is marked read
    decrementUnreadCount(state) {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },

    // Reset unread count to 0 (after mark-all-read)
    clearUnreadCount(state) {
      state.unreadCount = 0;
    },

    // Mark a realtime item as read locally (optimistic)
    markRealtimeItemRead(state, action: PayloadAction<number>) {
      const item = state.realtimeItems.find((n) => n.id === action.payload);
      if (item && !item.read) {
        item.read = true;
      }
    },

    // Mark all realtime items as read locally (optimistic)
    markAllRealtimeItemsRead(state) {
      state.realtimeItems.forEach((n) => {
        n.read = true;
      });
    },

    // Remove a realtime item when deleted
    removeRealtimeItem(state, action: PayloadAction<number>) {
      state.realtimeItems = state.realtimeItems.filter(
        (n) => n.id !== action.payload
      );
    },

    // Trigger bell shake animation
    triggerBellAnimation(state) {
      state.bellAnimating = true;
    },

    // Stop bell shake animation
    stopBellAnimation(state) {
      state.bellAnimating = false;
    },

    // Reset all state on logout
    clearNotifications() {
      return initialState;
    },
  },
});

export const {
  pushRealtimeNotification,
  setUnreadCount,
  decrementUnreadCount,
  clearUnreadCount,
  markRealtimeItemRead,
  markAllRealtimeItemsRead,
  removeRealtimeItem,
  triggerBellAnimation,
  stopBellAnimation,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
