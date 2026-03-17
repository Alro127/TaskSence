import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type { ApiResponse, ProjectAnalyticsResponse } from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
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
  tagTypes: ["Analytics"],
  endpoints: (builder) => ({
    getProjectAnalytics: builder.query<
      ApiResponse<ProjectAnalyticsResponse>,
      number
    >({
      query: (projectId) => `/projects/${projectId}/analytics`,
      providesTags: (_result, _error, projectId) => [
        { type: "Analytics", id: projectId },
      ],
    }),
  }),
});

export const { useGetProjectAnalyticsQuery } = analyticsApi;
