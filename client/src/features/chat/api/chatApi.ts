import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type { ApiResponse, ChatSessionResponse } from "@/types/api";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["ChatSession"],
  endpoints: (builder) => ({
    getSessions: builder.query<
      ApiResponse<ChatSessionResponse[]>,
      { cursor?: number; limit?: number }
    >({
      query: ({ cursor, limit = 20 }) => {
        const params = new URLSearchParams();
        if (cursor !== undefined) params.set("cursor", String(cursor));
        params.set("limit", String(limit));
        return `/chat/sessions?${params.toString()}`;
      },
      providesTags: ["ChatSession"],
    }),

    getSession: builder.query<ApiResponse<ChatSessionResponse>, number>({
      query: (id) => `/chat/sessions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ChatSession", id }],
    }),

    createSession: builder.mutation<ApiResponse<ChatSessionResponse>, void>({
      query: () => ({ url: "/chat/sessions", method: "POST" }),
      invalidatesTags: ["ChatSession"],
    }),

    deleteSession: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/chat/sessions/${id}`, method: "DELETE" }),
      invalidatesTags: ["ChatSession"],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
} = chatApi;
