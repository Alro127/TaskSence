import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  PageResponse,
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from "@/types/api";
import { apiBaseUrl } from "@/config/config";

type GetPublicWorkspacesParams = {
  userId: number;
  page?: number;
  size?: number;
  sort?: string;
};

export const workspaceApi = createApi({
  reducerPath: "workspaceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
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
    getMyWorkspaces: builder.query<ApiResponse<PageResponse<Workspace>>, void>({
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

    getPublicWorkspaces: builder.query<
      ApiResponse<PageResponse<Workspace>>,
      GetPublicWorkspacesParams
    >({
      query: ({ userId, page = 0, size = 10, sort }) => ({
        url: `/workspaces/public/${userId}`,
        params: {
          page,
          size,
          ...(sort ? { sort } : {}),
        },
      }),
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
