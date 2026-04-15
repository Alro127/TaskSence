import type { RootState } from "@/app/store";
import type {
  AIAgentResponse,
  AISession,
  AISessionDetail,
  AISessionMessage,
  ApiResponse,
  InitAISessionRequest,
  PageResponse,
} from "@/types/api";
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
  tagTypes: ["AgentSession", "AgentMessage"],
  endpoints: (builder) => ({
    initSession: builder.mutation<ApiResponse<AISessionDetail>, InitAISessionRequest>({
      query: (body) => ({
        url: "/api/v1/ai/sessions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AgentSession"],
    }),
    getSessions: builder.query<ApiResponse<PageResponse<AISession>>, { page?: number; size?: number } | void>({
      query: (params) => ({
        url: "/api/v1/sessions/",
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        },
      }),
      providesTags: ["AgentSession"],
    }),
    getSessionDetail: builder.query<ApiResponse<AISessionDetail>, number>({
      query: (sessionId) => ({
        url: `/api/v1/sessions/${sessionId}`,
      }),
      providesTags: (_result, _error, sessionId) => [{ type: "AgentSession", id: sessionId }],
    }),
    getSessionMessages: builder.query<
      ApiResponse<PageResponse<AISessionMessage>>,
      { sessionId: number; page?: number; size?: number }
    >({
      query: ({ sessionId, page = 0, size = 20 }) => ({
        url: `/api/v1/sessions/${sessionId}/messages`,
        params: { page, size },
      }),
      providesTags: (_result, _error, arg) => [{ type: "AgentMessage", id: arg.sessionId }],
    }),
    deleteSession: builder.mutation<ApiResponse<{ session_id: number }>, number>({
      query: (sessionId) => ({
        url: `/api/v1/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, sessionId) => [
        "AgentSession",
        { type: "AgentMessage", id: sessionId },
      ],
    }),
    callChatAgent: builder.mutation<
      ApiResponse<AIAgentResponse>,
      { sessionId: number; query: string; agent?: boolean }
    >({
      query: ({ sessionId, query, agent = false }) => ({
        url: `/api/v1/ai/chat/${sessionId}`,
        method: "POST",
        body: { query, agent },
      }),
      invalidatesTags: (_result, _error, arg) => [
        "AgentSession",
        { type: "AgentMessage", id: arg.sessionId },
      ],
    }),
  }),
});

export const {
  useCallChatAgentMutation,
  useDeleteSessionMutation,
  useGetSessionDetailQuery,
  useGetSessionMessagesQuery,
  useGetSessionsQuery,
  useInitSessionMutation,
} = agentApi;
