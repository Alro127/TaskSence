import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  CreateWorkflowFromProjectRequest,
  PageResponse,
  UpsertWorkflowRatingRequest,
  UpdateWorkflowDraftRequest,
  WorkflowDraftResponse,
  WorkflowFavoriteToggleResponse,
  WorkflowRatingResponse,
  WorkflowRatingSummaryResponse,
  WorkflowStatus,
} from "@/types/api";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const workflowApi = createApi({
  reducerPath: "workflowApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ["Workflow"],
  endpoints: (builder) => ({
    getMyWorkflows: builder.query<
      ApiResponse<PageResponse<WorkflowDraftResponse>>,
      { status?: WorkflowStatus; page?: number; size?: number }
    >({
      query: ({ status, page = 0, size = 20 }) => ({
        url: "/workflows/me",
        params: {
          page,
          size,
          ...(status ? { status } : {}),
        },
      }),
      providesTags: (result) => {
        const tags: Array<{ type: "Workflow"; id: string | number }> = [
          { type: "Workflow", id: "LIST" },
        ];

        const workflows = result?.data?.data ?? [];
        for (const workflow of workflows) {
          tags.push({ type: "Workflow", id: workflow.id });
        }

        return tags;
      },
    }),

    exploreWorkflows: builder.query<
      ApiResponse<PageResponse<WorkflowDraftResponse>>,
      { keyword?: string; page?: number; size?: number }
    >({
      query: ({ keyword, page = 0, size = 20 }) => ({
        url: "/workflows/explore",
        params: {
          page,
          size,
          ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
        },
      }),
      providesTags: (result) => {
        const tags: Array<{ type: "Workflow"; id: string | number }> = [
          { type: "Workflow", id: "EXPLORE" },
        ];

        const workflows = result?.data?.data ?? [];
        for (const workflow of workflows) {
          tags.push({ type: "Workflow", id: workflow.id });
        }

        return tags;
      },
    }),

    getWorkflowDetail: builder.query<ApiResponse<WorkflowDraftResponse>, { workflowId: number }>({
      query: ({ workflowId }) => ({
        url: `/workflows/${workflowId}`,
      }),
      providesTags: (_result, _error, { workflowId }) => [{ type: "Workflow", id: workflowId }],
    }),

    updateWorkflowDraft: builder.mutation<
      ApiResponse<WorkflowDraftResponse>,
      { workflowId: number; body: UpdateWorkflowDraftRequest }
    >({
      query: ({ workflowId, body }) => ({
        url: `/workflows/${workflowId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "Workflow", id: workflowId },
        { type: "Workflow", id: "LIST" },
      ],
    }),

    publishWorkflow: builder.mutation<ApiResponse<WorkflowDraftResponse>, { workflowId: number }>({
      query: ({ workflowId }) => ({
        url: `/workflows/${workflowId}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "Workflow", id: workflowId },
        { type: "Workflow", id: "LIST" },
      ],
    }),

    createWorkflowDraftFromProject: builder.mutation<
      ApiResponse<WorkflowDraftResponse>,
      { projectId: number; body?: CreateWorkflowFromProjectRequest }
    >({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/workflows/drafts/from-project`,
        method: "POST",
        ...(body ? { body } : {}),
      }),
      invalidatesTags: [{ type: "Workflow", id: "LIST" }],
    }),

    upsertWorkflowRating: builder.mutation<
      ApiResponse<WorkflowRatingResponse>,
      { workflowId: number; body: UpsertWorkflowRatingRequest }
    >({
      query: ({ workflowId, body }) => ({
        url: `/workflows/${workflowId}/rating`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "Workflow", id: workflowId },
        { type: "Workflow", id: "EXPLORE" },
      ],
    }),

    getWorkflowRatingSummary: builder.query<
      ApiResponse<WorkflowRatingSummaryResponse>,
      { workflowId: number }
    >({
      query: ({ workflowId }) => ({
        url: `/workflows/${workflowId}/rating-summary`,
      }),
      providesTags: (_result, _error, { workflowId }) => [
        { type: "Workflow", id: `RATING_SUMMARY_${workflowId}` },
      ],
    }),

    toggleWorkflowFavorite: builder.mutation<
      ApiResponse<WorkflowFavoriteToggleResponse>,
      { workflowId: number }
    >({
      query: ({ workflowId }) => ({
        url: `/workflows/${workflowId}/favorite/toggle`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { workflowId }) => [
        { type: "Workflow", id: workflowId },
        { type: "Workflow", id: "EXPLORE" },
      ],
    }),
  }),
});

export const {
  useGetMyWorkflowsQuery,
  useExploreWorkflowsQuery,
  useGetWorkflowDetailQuery,
  useUpdateWorkflowDraftMutation,
  usePublishWorkflowMutation,
  useCreateWorkflowDraftFromProjectMutation,
  useUpsertWorkflowRatingMutation,
  useGetWorkflowRatingSummaryQuery,
  useToggleWorkflowFavoriteMutation,
} = workflowApi;
