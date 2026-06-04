import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiResponse,
  AuthRequest,
  AuthResponse,
  VerifyOtpParams,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  GoogleLoginRequest,
  TokenRequest,
} from "@/types/api";
import { apiBaseUrl } from "@/config/config";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiBaseUrl,
  }),
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, AuthRequest>({
      query: (credentials) => ({
        url: "/auth/login/local",
        method: "POST",
        body: credentials,
      }),
    }),

    loginWithGoogle: builder.mutation<
      ApiResponse<AuthResponse>,
      GoogleLoginRequest
    >({
      query: ({ code }) => ({
        url: `/auth/login/google?code=${encodeURIComponent(code)}`,
        method: "POST",
      }),
    }),

    register: builder.mutation<ApiResponse<void>, AuthRequest>({
      query: (credentials) => ({
        url: "/auth/register",
        method: "POST",
        body: credentials,
      }),
    }),

    verifyOtp: builder.mutation<ApiResponse<AuthResponse>, VerifyOtpParams>({
      query: ({ email, otp }) => ({
        url: `/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`,
        method: "POST",
      }),
    }),

    forgotPassword: builder.mutation<ApiResponse<void>, ForgotPasswordRequest>({
      query: ({ email }) => ({
        url: `/auth/forgot-password?email=${encodeURIComponent(email)}`,
        method: "POST",
      }),
    }),

    resetPassword: builder.mutation<ApiResponse<void>, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    logout: builder.mutation<ApiResponse<void>, TokenRequest>({
      query: (body) => ({
        url: "/auth/logout",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLoginWithGoogleMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} = authApi;
