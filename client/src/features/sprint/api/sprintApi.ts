import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  PageResponse,
  SprintResponse,
  CreateSprintRequest,
  UpdateSprintRequest,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const sprintApi = createApi({
  reducerPath: "sprintApi",
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
  tagTypes: ["Sprint"],
  endpoints: (builder) => ({
    getProjectSprints: builder.query<
      ApiResponse<PageResponse<SprintResponse>>,
      { projectId: number; page?: number; size?: number }
    >({
      query: ({ projectId, page = 0, size = 50 }) => ({
        url: `/sprints/project/${projectId}`,
        params: { page, size },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: "Sprint", id: `PROJECT_${projectId}` },
      ],
    }),

    createSprint: builder.mutation<ApiResponse<SprintResponse>, CreateSprintRequest>({
      query: (body) => ({
        url: "/sprints",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Sprint", id: `PROJECT_${projectId}` },
      ],
    }),

    updateSprint: builder.mutation<
      ApiResponse<SprintResponse>,
      { projectId: number; sprintId: number } & UpdateSprintRequest
    >({
      query: ({ sprintId, projectId: _projectId, ...body }) => ({
        url: `/sprints/${sprintId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { sprintId, projectId }) => [
        { type: "Sprint", id: sprintId },
        { type: "Sprint", id: `PROJECT_${projectId}` },
      ],
    }),

    deleteSprint: builder.mutation<
      ApiResponse<void>,
      { projectId: number; sprintId: number }
    >({
      query: ({ sprintId }) => ({
        url: `/sprints/${sprintId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId, sprintId }) => [
        { type: "Sprint", id: sprintId },
        { type: "Sprint", id: `PROJECT_${projectId}` },
      ],
    }),
  }),
});

export const {
  useGetProjectSprintsQuery,
  useCreateSprintMutation,
  useUpdateSprintMutation,
  useDeleteSprintMutation,
} = sprintApi;
