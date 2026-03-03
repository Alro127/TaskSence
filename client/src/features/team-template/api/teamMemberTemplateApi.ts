import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  TeamMemberTemplate,
  AddTeamMemberTemplateRequest,
  AddTeamMemberResultItem,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const teamMemberTemplateApi = createApi({
  reducerPath: "teamMemberTemplateApi",
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
  tagTypes: ["TeamMember"],
  endpoints: (builder) => ({
    // GET /team-templates/:templateId/members
    getMembers: builder.query<ApiResponse<TeamMemberTemplate[]>, number>({
      query: (templateId) => `/team-templates/${templateId}/members`,
      providesTags: (_result, _error, templateId) => [
        { type: "TeamMember", id: templateId },
      ],
    }),

    // POST /team-templates/:templateId/members/batch
    addMembers: builder.mutation<
      ApiResponse<AddTeamMemberResultItem[]>,
      { templateId: number } & AddTeamMemberTemplateRequest
    >({
      query: ({ templateId, ...body }) => ({
        url: `/team-templates/${templateId}/members/batch`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "TeamMember", id: arg.templateId },
      ],
    }),

    // DELETE /team-templates/:templateId/members/:userId
    removeMember: builder.mutation<
      ApiResponse<void>,
      { templateId: number; userId: number }
    >({
      query: ({ templateId, userId }) => ({
        url: `/team-templates/${templateId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "TeamMember", id: arg.templateId },
      ],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useAddMembersMutation,
  useRemoveMemberMutation,
} = teamMemberTemplateApi;
