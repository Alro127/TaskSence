import type { RootState } from "@/app/store";
import type { ApiResponse, AIAgentResponse } from "@/types/api";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl =
  import.meta.env.VITE_API_AGENT_BASE_URL || "http://localhost:8000";

export const agentApi = createApi({
  reducerPath: "agentApi",
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
  tagTypes: ["Agent"],
  endpoints: (builder) => ({
    callChatAgent: builder.mutation<
      ApiResponse<AIAgentResponse>,
      { query: string }
    >({
      query: (body) => ({
        url: `/ai/chat/0`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useCallChatAgentMutation } = agentApi;
