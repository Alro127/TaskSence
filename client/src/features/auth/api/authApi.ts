import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiResponse,
  AuthRequest,
  AuthResponse,
  VerifyOtpParams,
  ForgotPasswordRequest,
} from "@/types/api";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
  }),
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, AuthRequest>({
      query: (credentials) => ({
        url: "/auth/login/local",
        method: "POST",
        body: credentials,
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

    // Forgot password - UI ready, will connect when BE is ready
    forgotPassword: builder.mutation<ApiResponse<void>, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useForgotPasswordMutation,
} = authApi;
