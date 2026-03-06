import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectMemberRole,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const projectApi = createApi({
  reducerPath: "projectApi",
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
  tagTypes: ["Project"],
  endpoints: (builder) => ({
    getProjectsByWorkspace: builder.query<ApiResponse<Project[]>, number>({
      query: (workspaceId) => `/workspaces/${workspaceId}/projects`,
      providesTags: (_result, _error, workspaceId) => [
        { type: "Project", id: `WORKSPACE_${workspaceId}` },
      ],
    }),

    getProjectById: builder.query<
      ApiResponse<Project>,
      { workspaceId: number; projectId: number }
    >({
      query: ({ workspaceId, projectId }) =>
        `/workspaces/${workspaceId}/projects/${projectId}`,
      providesTags: (_result, _error, { projectId }) => [
        { type: "Project", id: projectId },
      ],
    }),

    createProject: builder.mutation<
      ApiResponse<Project>,
      { workspaceId: number } & CreateProjectRequest
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/projects`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "Project", id: `WORKSPACE_${workspaceId}` },
      ],
    }),

    updateProject: builder.mutation<
      ApiResponse<Project>,
      { workspaceId: number; projectId: number } & UpdateProjectRequest
    >({
      query: ({ workspaceId, projectId, ...body }) => ({
        url: `/workspaces/${workspaceId}/projects/${projectId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId, workspaceId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: `WORKSPACE_${workspaceId}` },
      ],
    }),

    deleteProject: builder.mutation<
      ApiResponse<void>,
      { workspaceId: number; projectId: number }
    >({
      query: ({ workspaceId, projectId }) => ({
        url: `/workspaces/${workspaceId}/projects/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "Project", id: `WORKSPACE_${workspaceId}` },
      ],
    }),

    /** GET /projects/{projectId}/members/me/role */
    getCurrentUserRole: builder.query<ApiResponse<ProjectMemberRole>, number>({
      query: (projectId) => `/projects/${projectId}/members/me/role`,
    }),
  }),
});

export const {
  useGetProjectsByWorkspaceQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetCurrentUserRoleQuery,
} = projectApi;
