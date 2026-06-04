import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  CreateTagRequest,
  TagResponse,
  UpdateTagRequest,
} from "@/types/api";
import { apiBaseUrl } from "@/config/config";

export const tagApi = createApi({
  reducerPath: "tagApi",
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
  tagTypes: ["Tag"],
  endpoints: (builder) => ({
    getTagsByProject: builder.query<ApiResponse<TagResponse[]>, number>({
      query: (projectId) => `/projects/${projectId}/tags`,
      providesTags: (_result, _error, projectId) => [
        { type: "Tag", id: `PROJECT_${projectId}` },
      ],
    }),

    createTag: builder.mutation<
      ApiResponse<TagResponse>,
      { projectId: number; body: CreateTagRequest }
    >({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/tags`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Tag", id: `PROJECT_${projectId}` },
      ],
    }),

    updateTag: builder.mutation<
      ApiResponse<TagResponse>,
      { projectId: number; tagId: number; body: UpdateTagRequest }
    >({
      query: ({ projectId, tagId, body }) => ({
        url: `/projects/${projectId}/tags/${tagId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Tag", id: `PROJECT_${projectId}` },
      ],
    }),

    deleteTag: builder.mutation<
      ApiResponse<void>,
      { projectId: number; tagId: number }
    >({
      query: ({ projectId, tagId }) => ({
        url: `/projects/${projectId}/tags/${tagId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Tag", id: `PROJECT_${projectId}` },
      ],
    }),
  }),
});

export const {
  useGetTagsByProjectQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = tagApi;
