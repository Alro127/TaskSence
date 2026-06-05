import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  CommentResponse,
  CommentCreateRequest,
  CommentUpdateRequest,
  CommentReactionRequest,
  UserSummaryResponse,
} from "@/types/api";
import { apiBaseUrl } from "@/config/config";

export const commentApi = createApi({
  reducerPath: "commentApi",
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
  tagTypes: ["Comment"],
  endpoints: (builder) => ({
    /** GET /comments/task/{taskId}?cursor=&limit= */
    getComments: builder.query<
      ApiResponse<CommentResponse[]>,
      { taskId: number; cursor?: number; limit?: number }
    >({
      query: ({ taskId, cursor, limit = 20 }) => ({
        url: `/comments/task/${taskId}`,
        params: { ...(cursor !== undefined ? { cursor } : {}), limit },
      }),
      providesTags: (_result, _error, { taskId }) => [
        { type: "Comment", id: `TASK_${taskId}` },
      ],
    }),

    /** POST /comments */
    createComment: builder.mutation<ApiResponse<CommentResponse>, CommentCreateRequest>({
      query: (body) => ({ url: "/comments", method: "POST", body }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Comment", id: `TASK_${taskId}` },
      ],
    }),

    /** PUT /comments/{commentId} */
    updateComment: builder.mutation<
      ApiResponse<CommentResponse>,
      { commentId: number; taskId: number } & CommentUpdateRequest
    >({
      query: ({ commentId, taskId: _taskId, ...body }) => ({
        url: `/comments/${commentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Comment", id: `TASK_${taskId}` },
      ],
    }),

    /** DELETE /comments/{commentId} */
    deleteComment: builder.mutation<
      ApiResponse<void>,
      { commentId: number; taskId: number }
    >({
      query: ({ commentId }) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Comment", id: `TASK_${taskId}` },
      ],
    }),

    /** POST /comments/{commentId}/reactions */
    addReaction: builder.mutation<
      ApiResponse<void>,
      { commentId: number; taskId: number } & CommentReactionRequest
    >({
      query: ({ commentId, taskId: _taskId, ...body }) => ({
        url: `/comments/${commentId}/reactions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Comment", id: `TASK_${taskId}` },
      ],
    }),

    /** DELETE /comments/{commentId}/reactions */
    removeReaction: builder.mutation<
      ApiResponse<void>,
      { commentId: number; taskId: number } & CommentReactionRequest
    >({
      query: ({ commentId, taskId: _taskId, ...body }) => ({
        url: `/comments/${commentId}/reactions`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Comment", id: `TASK_${taskId}` },
      ],
    }),

    /** PATCH /comments/{commentId}/reactions — upsert (switch icon atomically) */
    updateReaction: builder.mutation<
      ApiResponse<void>,
      { commentId: number; taskId: number } & CommentReactionRequest
    >({
      query: ({ commentId, taskId: _taskId, ...body }) => ({
        url: `/comments/${commentId}/reactions`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Comment", id: `TASK_${taskId}` },
      ],
    }),

    /** GET /comments/{commentId}/reactions/{icon} — who reacted */
    getReactionUsers: builder.query<
      ApiResponse<UserSummaryResponse[]>,
      { commentId: number; icon: string }
    >({
      query: ({ commentId, icon }) =>
        `/comments/${commentId}/reactions/${encodeURIComponent(icon)}`,
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useLazyGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useUpdateReactionMutation,
  useGetReactionUsersQuery,
  useLazyGetReactionUsersQuery,
} = commentApi;
