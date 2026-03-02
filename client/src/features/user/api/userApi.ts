import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/app/store";
import type { ApiResponse, User, UpdateUserRequest } from "@/types/api";

interface MediaRequest {
  fileName: string;
  extension: string;
}

interface MediaResponse {
  uploadUrl: string;
  objectKey: string;
  fileUrl: string;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const userApi = createApi({
  reducerPath: "userApi",
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
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // Get current user profile
    getCurrentUser: builder.query<ApiResponse<User>, void>({
      query: () => ({
        url: "/users/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // Update user profile
    updateUserProfile: builder.mutation<ApiResponse<User>, UpdateUserRequest>({
      query: (body) => ({
        url: "/users/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Get presigned URL for avatar upload
    getAvatarPresignUrl: builder.mutation<ApiResponse<MediaResponse>, MediaRequest>({
      query: (body) => ({
        url: "/media/presign/avatar",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { 
  useGetCurrentUserQuery, 
  useUpdateUserProfileMutation,
  useGetAvatarPresignUrlMutation,
} = userApi;
