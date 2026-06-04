import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  NotificationResponse,
  DeleteNotificationsRequest,
} from "@/types/api";
import { apiBaseUrl } from "@/config/config";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Notification", "UnreadCount"],
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiResponse<NotificationResponse[]>,
      { cursor?: number; limit?: number }
    >({
      query: ({ cursor, limit = 10 }) => {
        const params = new URLSearchParams();
        if (cursor !== undefined) params.set("cursor", String(cursor));
        params.set("limit", String(limit));
        return `/notifications?${params.toString()}`;
      },
      providesTags: ["Notification"],
    }),

    getUnreadCount: builder.query<ApiResponse<number>, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["UnreadCount"],
    }),

    markAsRead: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["UnreadCount"],
    }),

    markAllAsRead: builder.mutation<ApiResponse<number>, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),

    deleteNotification: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),

    deleteNotifications: builder.mutation<
      ApiResponse<number>,
      DeleteNotificationsRequest
    >({
      query: (body) => ({
        url: "/notifications",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Notification", "UnreadCount"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteNotificationsMutation,
} = notificationApi;
