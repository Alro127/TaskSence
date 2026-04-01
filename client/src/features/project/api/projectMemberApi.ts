import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  PageResponse,
  ProjectMember,
  AddProjectMemberRequest,
  AddProjectMemberResultItem,
  UpdateProjectMemberRoleRequest,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const projectMemberApi = createApi({
  reducerPath: "projectMemberApi",
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
  tagTypes: ["ProjectMember"],
  endpoints: (builder) => ({
    /** GET /projects/{projectId}/members */
    getMembers: builder.query<
      ApiResponse<PageResponse<ProjectMember>>,
      { projectId: number; page: number; size: number }
    >({
      query: ({ projectId, page, size }) => ({
        url: `/projects/${projectId}/members`,
        params: { page, size },
      }),
      providesTags: (_result, _error, { projectId }) => [
        { type: "ProjectMember", id: projectId },
      ],
    }),

    /** POST /projects/{projectId}/members */
    addMembers: builder.mutation<
      ApiResponse<AddProjectMemberResultItem[]>,
      { projectId: number } & AddProjectMemberRequest
    >({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/members`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectMember", id: projectId },
      ],
    }),

    /** PATCH /projects/{projectId}/members/{userId}/role */
    updateMemberRole: builder.mutation<
      ApiResponse<ProjectMember>,
      { projectId: number; userId: number } & UpdateProjectMemberRoleRequest
    >({
      query: ({ projectId, userId, ...body }) => ({
        url: `/projects/${projectId}/members/${userId}/role`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectMember", id: projectId },
      ],
    }),

    /** DELETE /projects/{projectId}/members/{userId} */
    removeMember: builder.mutation<
      ApiResponse<void>,
      { projectId: number; userId: number }
    >({
      query: ({ projectId, userId }) => ({
        url: `/projects/${projectId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectMember", id: projectId },
      ],
    }),

    /** DELETE /workspaces/{workspaceId}/projects/{projectId}/leave */
    leaveProject: builder.mutation<ApiResponse<void>, { workspaceId: number; projectId: number }>({
      query: ({ workspaceId, projectId }) => ({
        url: `/workspaces/${workspaceId}/projects/${projectId}/leave`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectMember", id: projectId },
      ],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useAddMembersMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useLeaveProjectMutation,
} = projectMemberApi;
