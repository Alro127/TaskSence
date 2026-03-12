import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  PageResponse,
  WorkspaceInvite,
  CreateWorkspaceInviteRequest,
  CreateBulkWorkspaceInviteRequest,
  BulkInviteResult,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const workspaceInviteApi = createApi({
  reducerPath: "workspaceInviteApi",
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
  tagTypes: ["WorkspaceInvite"],
  endpoints: (builder) => ({
    getWorkspaceInvites: builder.query<
      ApiResponse<PageResponse<WorkspaceInvite>>,
      { workspaceId: number; page?: number; size?: number }
    >({
      query: ({ workspaceId, page = 0, size = 10 }) => ({
        url: `/workspaces/${workspaceId}/invites`,
        params: { page, size },
      }),
      providesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceInvite", id: workspaceId },
      ],
    }),

    inviteMember: builder.mutation<
      ApiResponse<WorkspaceInvite>,
      { workspaceId: number } & CreateWorkspaceInviteRequest
    >({
      query: ({ workspaceId, ...body }) => ({
        url: `/workspaces/${workspaceId}/invites`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceInvite", id: workspaceId },
      ],
    }),

    acceptInvite: builder.mutation<ApiResponse<WorkspaceInvite>, string>({
      query: (token) => ({
        url: `/workspaces/invites/accept`,
        method: "POST",
        body: { token },
      }),
    }),

    revokeInvite: builder.mutation<
      ApiResponse<void>,
      { inviteId: number; workspaceId: number }
    >({
      query: ({ inviteId }) => ({
        url: `/workspaces/invites/${inviteId}/revoke`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceInvite", id: workspaceId },
      ],
    }),

    bulkInviteMembers: builder.mutation<
      ApiResponse<BulkInviteResult>,
      { workspaceId: number } & CreateBulkWorkspaceInviteRequest
    >({
      query: ({ workspaceId, invites }) => ({
        url: `/workspaces/${workspaceId}/invites/bulk`,
        method: "POST",
        body: { invites },
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceInvite", id: workspaceId },
      ],
    }),
  }),
});

export const {
  useGetWorkspaceInvitesQuery,
  useInviteMemberMutation,
  useAcceptInviteMutation,
  useRevokeInviteMutation,
  useBulkInviteMembersMutation,
} = workspaceInviteApi;
