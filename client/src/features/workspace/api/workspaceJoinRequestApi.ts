import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  PageResponse,
  WorkspaceJoinRequest,
  CreateWorkspaceJoinRequestBody,
  ReviewWorkspaceJoinRequestBody,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const workspaceJoinRequestApi = createApi({
  reducerPath: "workspaceJoinRequestApi",
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
  tagTypes: ["WorkspaceJoinRequest"],
  endpoints: (builder) => ({
    // GET all join requests for a workspace (OWNER/MANAGER)
    getWorkspaceJoinRequests: builder.query<
      ApiResponse<PageResponse<WorkspaceJoinRequest>>,
      { workspaceId: number; page?: number; size?: number }
    >({
      query: ({ workspaceId, page = 0, size = 10 }) => ({
        url: `/workspace-join-requests/workspaces/${workspaceId}`,
        params: { page, size },
      }),
      providesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceJoinRequest", id: workspaceId },
      ],
    }),

    // POST — request to join a public workspace
    createJoinRequest: builder.mutation<
      ApiResponse<WorkspaceJoinRequest>,
      { workspaceId: number; body: CreateWorkspaceJoinRequestBody }
    >({
      query: ({ workspaceId, body }) => ({
        url: `/workspace-join-requests/workspaces/${workspaceId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceJoinRequest", id: workspaceId },
      ],
    }),

    // PATCH — approve or reject a join request
    reviewJoinRequest: builder.mutation<
      ApiResponse<WorkspaceJoinRequest>,
      { requestId: number; workspaceId: number; body: ReviewWorkspaceJoinRequestBody }
    >({
      query: ({ requestId, body }) => ({
        url: `/workspace-join-requests/${requestId}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceJoinRequest", id: workspaceId },
      ],
    }),

    // PATCH — cancel own join request
    cancelJoinRequest: builder.mutation<
      ApiResponse<WorkspaceJoinRequest>,
      { requestId: number; workspaceId: number }
    >({
      query: ({ requestId }) => ({
        url: `/workspace-join-requests/${requestId}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { workspaceId }) => [
        { type: "WorkspaceJoinRequest", id: workspaceId },
      ],
    }),
  }),
});

export const {
  useGetWorkspaceJoinRequestsQuery,
  useCreateJoinRequestMutation,
  useReviewJoinRequestMutation,
  useCancelJoinRequestMutation,
} = workspaceJoinRequestApi;
