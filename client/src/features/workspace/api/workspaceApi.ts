import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const workspaceApi = createApi({
  reducerPath: "workspaceApi",
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
  tagTypes: ["Workspace"],
  endpoints: (builder) => ({
    getMyWorkspaces: builder.query<ApiResponse<Workspace[]>, void>({
      query: () => "/workspaces",
      providesTags: ["Workspace"],
    }),

    getWorkspaceById: builder.query<ApiResponse<Workspace>, number>({
      query: (id) => `/workspaces/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Workspace", id }],
    }),

    createWorkspace: builder.mutation<ApiResponse<Workspace>, CreateWorkspaceRequest>({
      query: (body) => ({
        url: "/workspaces",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workspace"],
    }),

    updateWorkspace: builder.mutation<
      ApiResponse<Workspace>,
      { id: number } & UpdateWorkspaceRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/workspaces/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Workspace"],
    }),

    deleteWorkspace: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/workspaces/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workspace"],
    }),

    searchWorkspaces: builder.query<
      ApiResponse<Workspace[]>,
      { name: string; cursor?: number; limit?: number }
    >({
      query: ({ name, cursor, limit = 20 }) => ({
        url: "/workspaces/search",
        params: { name, ...(cursor ? { cursor } : {}), limit },
      }),
    }),

    getPublicWorkspaces: builder.query<ApiResponse<Workspace[]>, number>({
      query: (userId) => `/workspaces/public/${userId}`,
    }),
  }),
});

export const {
  useGetMyWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useSearchWorkspacesQuery,
  useGetPublicWorkspacesQuery,
} = workspaceApi;
