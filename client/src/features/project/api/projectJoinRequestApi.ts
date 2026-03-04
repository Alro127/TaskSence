import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  ProjectJoinRequest,
  SendProjectJoinRequestBody,
  ReviewProjectJoinRequestBody,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const projectJoinRequestApi = createApi({
  reducerPath: "projectJoinRequestApi",
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
  tagTypes: ["ProjectJoinRequest"],
  endpoints: (builder) => ({
    /** POST /projects/{projectId}/join-requests */
    sendJoinRequest: builder.mutation<
      ApiResponse<ProjectJoinRequest>,
      { projectId: number } & SendProjectJoinRequestBody
    >({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/join-requests`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectJoinRequest", id: projectId },
      ],
    }),

    /** GET /projects/{projectId}/join-requests */
    getJoinRequests: builder.query<ApiResponse<ProjectJoinRequest[]>, number>({
      query: (projectId) => `/projects/${projectId}/join-requests`,
      providesTags: (_result, _error, projectId) => [
        { type: "ProjectJoinRequest", id: projectId },
      ],
    }),

    /** PATCH /projects/{projectId}/join-requests/{requestId}/review */
    reviewJoinRequest: builder.mutation<
      ApiResponse<ProjectJoinRequest>,
      { projectId: number; requestId: number } & ReviewProjectJoinRequestBody
    >({
      query: ({ projectId, requestId, ...body }) => ({
        url: `/projects/${projectId}/join-requests/${requestId}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectJoinRequest", id: projectId },
      ],
    }),

    /** DELETE /projects/{projectId}/join-requests/{requestId} */
    cancelJoinRequest: builder.mutation<
      ApiResponse<void>,
      { projectId: number; requestId: number }
    >({
      query: ({ projectId, requestId }) => ({
        url: `/projects/${projectId}/join-requests/${requestId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "ProjectJoinRequest", id: projectId },
      ],
    }),
  }),
});

export const {
  useSendJoinRequestMutation,
  useGetJoinRequestsQuery,
  useReviewJoinRequestMutation,
  useCancelJoinRequestMutation,
} = projectJoinRequestApi;
