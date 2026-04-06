import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  CreateWorkflowFromProjectRequest,
  PageResponse,
  UpdateWorkflowDraftRequest,
  WorkflowDraftResponse,
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
  }),
});

export const {
  useGetMyWorkflowsQuery,
  useUpdateWorkflowDraftMutation,
  usePublishWorkflowMutation,
  useCreateWorkflowDraftFromProjectMutation,
} = workflowApi;
