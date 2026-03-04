import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  WorkspaceMember,
  UpdateWorkspaceRoleRequest,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const workspaceMemberApi = createApi({
  reducerPath: "workspaceMemberApi",
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
  tagTypes: ["WorkspaceMember"],
  endpoints: (builder) => ({
    getWorkspaceMembers: builder.query<
      ApiResponse<WorkspaceMember[]>,
      number
    >({
      query: (workspaceId) => `/workspaces/${workspaceId}/members`,
      providesTags: (_result, _error, workspaceId) => [
        { type: "WorkspaceMember", id: workspaceId },
      ],
    }),

    updateMemberRole: builder.mutation<
      ApiResponse<WorkspaceMember>,
      { workspaceId: number; memberId: number } & UpdateWorkspaceRoleRequest
    >({
      query: ({ workspaceId, memberId, role }) => ({
        url: `/workspaces/${workspaceId}/members/${memberId}`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceMember", id: workspaceId },
      ],
    }),

    removeMember: builder.mutation<
      ApiResponse<void>,
      { workspaceId: number; memberId: number }
    >({
      query: ({ workspaceId, memberId }) => ({
        url: `/workspaces/${workspaceId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceMember", id: workspaceId },
      ],
    }),
  }),
});

export const {
  useGetWorkspaceMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} = workspaceMemberApi;
