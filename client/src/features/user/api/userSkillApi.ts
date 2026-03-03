import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type { ApiResponse, UserSkill, UserSkillRequest } from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const userSkillApi = createApi({
  reducerPath: "userSkillApi",
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
  tagTypes: ["UserSkill"],
  endpoints: (builder) => ({
    // GET /users/me/skills
    getMySkills: builder.query<ApiResponse<UserSkill[]>, void>({
      query: () => "/users/me/skills",
      providesTags: ["UserSkill"],
    }),

    // GET /users/{userId}/skills — view-only for other users
    getUserSkills: builder.query<ApiResponse<UserSkill[]>, number>({
      query: (userId) => `/users/${userId}/skills`,
      providesTags: (_result, _error, userId) => [
        { type: "UserSkill", id: `user-${userId}` },
      ],
    }),

    // POST /users/me/skills
    addSkill: builder.mutation<ApiResponse<UserSkill>, UserSkillRequest>({
      query: (body) => ({
        url: "/users/me/skills",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserSkill"],
    }),

    // PUT /users/me/skills/{skillId}
    updateSkill: builder.mutation<
      ApiResponse<UserSkill>,
      { skillId: number; data: UserSkillRequest }
    >({
      query: ({ skillId, data }) => ({
        url: `/users/me/skills/${skillId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["UserSkill"],
    }),

    // DELETE /users/me/skills/{skillId}
    deleteSkill: builder.mutation<ApiResponse<void>, number>({
      query: (skillId) => ({
        url: `/users/me/skills/${skillId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserSkill"],
    }),
  }),
});

export const {
  useGetMySkillsQuery,
  useGetUserSkillsQuery,
  useAddSkillMutation,
  useUpdateSkillMutation,
  useDeleteSkillMutation,
} = userSkillApi;
