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

    getMyFavoriteWorkflows: builder.query<
      ApiResponse<PageResponse<WorkflowDraftResponse>>,
      { page?: number; size?: number }
    >({
      query: ({ page = 0, size = 20 }) => ({
        url: "/workflows/me/favorites",
        params: {
          page,
          size,
        },
      }),
      providesTags: (result) => {
        const tags: Array<{ type: "Workflow"; id: string | number }> = [
          { type: "Workflow", id: "FAVORITES" },
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
      async onQueryStarted({ workflowId }, { dispatch, getState, queryFulfilled }) {
        const state = getState() as RootState;
        const affectedQueries = workflowApi.util.selectInvalidatedBy(state, [
          { type: "Workflow", id: workflowId },
          { type: "Workflow", id: "EXPLORE" },
          { type: "Workflow", id: "FAVORITES" },
          { type: "Workflow", id: "LIST" },
        ]);

        let workflowSnapshot: WorkflowDraftResponse | null = null;
        for (const query of affectedQueries) {
          if (workflowSnapshot) {
            break;
          }

          switch (query.endpointName) {
            case "getMyWorkflows": {
              const cache = workflowApi.endpoints.getMyWorkflows.select(
                query.originalArgs as { status?: WorkflowStatus; page?: number; size?: number },
              )(state);
              workflowSnapshot = cache.data?.data.data.find((item: WorkflowDraftResponse) => item.id === workflowId) ?? null;
              break;
            }
            case "getMyFavoriteWorkflows": {
              const cache = workflowApi.endpoints.getMyFavoriteWorkflows.select(
                query.originalArgs as { page?: number; size?: number },
              )(state);
              workflowSnapshot = cache.data?.data.data.find((item: WorkflowDraftResponse) => item.id === workflowId) ?? null;
              break;
            }
            case "exploreWorkflows": {
              const cache = workflowApi.endpoints.exploreWorkflows.select(
                query.originalArgs as { keyword?: string; page?: number; size?: number },
              )(state);
              workflowSnapshot = cache.data?.data.data.find((item: WorkflowDraftResponse) => item.id === workflowId) ?? null;
              break;
            }
            case "getWorkflowDetail": {
              const cache = workflowApi.endpoints.getWorkflowDetail.select(
                query.originalArgs as { workflowId: number },
              )(state);
              workflowSnapshot = cache.data?.data?.id === workflowId ? cache.data.data : null;
              break;
            }
            default:
              break;
          }
        }

        const patchResults: Array<{ undo: () => void }> = [];

        for (const query of affectedQueries) {
          switch (query.endpointName) {
            case "getMyWorkflows":
              patchResults.push(
                dispatch(
                  workflowApi.util.updateQueryData(
                    "getMyWorkflows",
                    query.originalArgs as { status?: WorkflowStatus; page?: number; size?: number },
                    (draft) => {
                      const workflow = draft.data.data.find((item) => item.id === workflowId);
                      if (workflow) {
                        workflow.favorited = true;
                      }
                    },
                  ),
                ),
              );
              break;
            case "exploreWorkflows":
              patchResults.push(
                dispatch(
                  workflowApi.util.updateQueryData(
                    "exploreWorkflows",
                    query.originalArgs as { keyword?: string; page?: number; size?: number },
                    (draft) => {
                      const workflow = draft.data.data.find((item) => item.id === workflowId);
                      if (workflow) {
                        workflow.favorited = true;
                      }
                    },
                  ),
                ),
              );
              break;
            case "getWorkflowDetail":
              patchResults.push(
                dispatch(
                  workflowApi.util.updateQueryData(
                    "getWorkflowDetail",
                    query.originalArgs as { workflowId: number },
                    (draft) => {
                      const response = draft as ApiResponse<WorkflowDraftResponse>;
                      if (response.data.id === workflowId) {
                        response.data.favorited = true;
                      }
                    },
                  ),
                ),
              );
              break;
            case "getMyFavoriteWorkflows":
              patchResults.push(
                dispatch(
                  workflowApi.util.updateQueryData(
                    "getMyFavoriteWorkflows",
                    query.originalArgs as { page?: number; size?: number },
                    (draft) => {
                      const response = draft as ApiResponse<PageResponse<WorkflowDraftResponse>>;
                      const items = response.data.data;
                      const index = items.findIndex((item) => item.id === workflowId);

                      if (index >= 0) {
                        items[index].favorited = true;
                        return;
                      }

                      if (workflowSnapshot) {
                        items.unshift({ ...workflowSnapshot, favorited: true });
                      }
                    },
                  ),
                ),
              );
              break;
            default:
              break;
          }
        }

        try {
          const { data } = await queryFulfilled;
          const favorited = data.data.favorited;

          for (const query of affectedQueries) {
            switch (query.endpointName) {
              case "getMyWorkflows":
                dispatch(
                  workflowApi.util.updateQueryData(
                    "getMyWorkflows",
                    query.originalArgs as { status?: WorkflowStatus; page?: number; size?: number },
                    (draft) => {
                      const workflow = draft.data.data.find((item) => item.id === workflowId);
                      if (workflow) {
                        workflow.favorited = favorited;
                      }
                    },
                  ),
                );
                break;
              case "exploreWorkflows":
                dispatch(
                  workflowApi.util.updateQueryData(
                    "exploreWorkflows",
                    query.originalArgs as { keyword?: string; page?: number; size?: number },
                    (draft) => {
                      const workflow = draft.data.data.find((item) => item.id === workflowId);
                      if (workflow) {
                        workflow.favorited = favorited;
                      }
                    },
                  ),
                );
                break;
              case "getWorkflowDetail":
                dispatch(
                  workflowApi.util.updateQueryData(
                    "getWorkflowDetail",
                    query.originalArgs as { workflowId: number },
                    (draft) => {
                      const response = draft as ApiResponse<WorkflowDraftResponse>;
                      if (response.data.id === workflowId) {
                        response.data.favorited = favorited;
                      }
                    },
                  ),
                );
                break;
              case "getMyFavoriteWorkflows":
                dispatch(
                  workflowApi.util.updateQueryData(
                    "getMyFavoriteWorkflows",
                    query.originalArgs as { page?: number; size?: number },
                    (draft) => {
                      const response = draft as ApiResponse<PageResponse<WorkflowDraftResponse>>;
                      const items = response.data.data;
                      const index = items.findIndex((item) => item.id === workflowId);

                      if (favorited) {
                        if (index >= 0) {
                          items[index].favorited = true;
                        } else if (workflowSnapshot) {
                          items.unshift({ ...workflowSnapshot, favorited: true });
                        }
                      } else if (index >= 0) {
                        items.splice(index, 1);
                      }
                    },
                  ),
                );
                break;
              default:
                break;
            }
          }
        } catch {
          for (const patchResult of patchResults.reverse()) {
            patchResult.undo();
          }
        }
      },
    }),
  }),
});

export const {
  useGetMyWorkflowsQuery,
  useGetMyFavoriteWorkflowsQuery,
  useExploreWorkflowsQuery,
  useGetWorkflowDetailQuery,
  useUpdateWorkflowDraftMutation,
  usePublishWorkflowMutation,
  useCreateWorkflowDraftFromProjectMutation,
  useUpsertWorkflowRatingMutation,
  useGetWorkflowRatingSummaryQuery,
  useToggleWorkflowFavoriteMutation,
} = workflowApi;
