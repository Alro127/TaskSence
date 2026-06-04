import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  CommentReactionRequest,
  UserSummaryResponse,
  WorkflowCommentCreateRequest,
  WorkflowCommentResponse,
  WorkflowCommentUpdateRequest,
} from "@/types/api";
import { apiBaseUrl } from "@/config/config";

export const workflowCommentApi = createApi({
  reducerPath: "workflowCommentApi",
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
  tagTypes: ["WorkflowComment"],
  endpoints: (builder) => ({
    getWorkflowComments: builder.query<
      ApiResponse<WorkflowCommentResponse[]>,
      { workflowId: number; cursor?: number; limit?: number }
    >({
      query: ({ workflowId, cursor, limit = 20 }) => ({
        url: `/workflow-comments/workflow/${workflowId}`,
        params: {
          ...(cursor !== undefined ? { cursor } : {}),
          limit,
        },
      }),
      providesTags: (_result, _error, { workflowId }) => [
        { type: "WorkflowComment", id: `WORKFLOW_${workflowId}` },
      ],
    }),

    createWorkflowComment: builder.mutation<
      ApiResponse<WorkflowCommentResponse>,
      WorkflowCommentCreateRequest
    >({
      query: (body) => ({
        url: "/workflow-comments",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "WorkflowComment", id: `WORKFLOW_${workflowId}` },
      ],
    }),

    updateWorkflowComment: builder.mutation<
      ApiResponse<WorkflowCommentResponse>,
      { commentId: number; workflowId: number } & WorkflowCommentUpdateRequest
    >({
      query: ({ commentId, workflowId: _workflowId, ...body }) => ({
        url: `/workflow-comments/${commentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "WorkflowComment", id: `WORKFLOW_${workflowId}` },
      ],
    }),

    deleteWorkflowComment: builder.mutation<
      ApiResponse<void>,
      { commentId: number; workflowId: number }
    >({
      query: ({ commentId }) => ({
        url: `/workflow-comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "WorkflowComment", id: `WORKFLOW_${workflowId}` },
      ],
    }),

    addWorkflowCommentReaction: builder.mutation<
      ApiResponse<void>,
      { commentId: number; workflowId: number } & CommentReactionRequest
    >({
      query: ({ commentId, workflowId: _workflowId, ...body }) => ({
        url: `/workflow-comments/${commentId}/reactions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "WorkflowComment", id: `WORKFLOW_${workflowId}` },
      ],
    }),

    updateWorkflowCommentReaction: builder.mutation<
      ApiResponse<void>,
      { commentId: number; workflowId: number } & CommentReactionRequest
    >({
      query: ({ commentId, workflowId: _workflowId, ...body }) => ({
        url: `/workflow-comments/${commentId}/reactions`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "WorkflowComment", id: `WORKFLOW_${workflowId}` },
      ],
    }),

    removeWorkflowCommentReaction: builder.mutation<
      ApiResponse<void>,
      { commentId: number; workflowId: number } & CommentReactionRequest
    >({
      query: ({ commentId, workflowId: _workflowId, ...body }) => ({
        url: `/workflow-comments/${commentId}/reactions`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "WorkflowComment", id: `WORKFLOW_${workflowId}` },
      ],
    }),

    getWorkflowCommentReactionUsers: builder.query<
      ApiResponse<UserSummaryResponse[]>,
      { commentId: number; icon: string }
    >({
      query: ({ commentId, icon }) => ({
        url: `/workflow-comments/${commentId}/reactions/${encodeURIComponent(icon)}`,
      }),
    }),
  }),
});

export const {
  useGetWorkflowCommentsQuery,
  useLazyGetWorkflowCommentsQuery,
  useCreateWorkflowCommentMutation,
  useUpdateWorkflowCommentMutation,
  useDeleteWorkflowCommentMutation,
  useAddWorkflowCommentReactionMutation,
  useUpdateWorkflowCommentReactionMutation,
  useRemoveWorkflowCommentReactionMutation,
  useGetWorkflowCommentReactionUsersQuery,
  useLazyGetWorkflowCommentReactionUsersQuery,
} = workflowCommentApi;
