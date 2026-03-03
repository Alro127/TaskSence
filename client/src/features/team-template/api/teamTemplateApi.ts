import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type {
  ApiResponse,
  TeamTemplate,
  CreateTeamTemplateRequest,
  UpdateTeamTemplateRequest,
} from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const teamTemplateApi = createApi({
  reducerPath: "teamTemplateApi",
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
  tagTypes: ["TeamTemplate"],
  endpoints: (builder) => ({
    // GET /team-templates — my templates
    getMyTemplates: builder.query<ApiResponse<TeamTemplate[]>, void>({
      query: () => "/team-templates",
      providesTags: ["TeamTemplate"],
    }),

    // GET /team-templates/:id
    getTemplateById: builder.query<ApiResponse<TeamTemplate>, number>({
      query: (id) => `/team-templates/${id}`,
      providesTags: (_result, _error, id) => [{ type: "TeamTemplate", id }],
    }),

    // POST /team-templates
    createTemplate: builder.mutation<
      ApiResponse<TeamTemplate>,
      CreateTeamTemplateRequest
    >({
      query: (body) => ({
        url: "/team-templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TeamTemplate"],
    }),

    // PUT /team-templates/:id
    updateTemplate: builder.mutation<
      ApiResponse<TeamTemplate>,
      { id: number } & UpdateTeamTemplateRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/team-templates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        "TeamTemplate",
        { type: "TeamTemplate", id: arg.id },
      ],
    }),

    // DELETE /team-templates/:id
    deleteTemplate: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/team-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TeamTemplate"],
    }),
  }),
});

export const {
  useGetMyTemplatesQuery,
  useGetTemplateByIdQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = teamTemplateApi;
