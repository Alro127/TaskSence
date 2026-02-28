// API Response type matching backend ApiResponse<T>
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// Auth types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

// OTP verification
export interface VerifyOtpParams {
  email: string;
  otp: string;
}

// Forgot password (for future BE integration)
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// User
export interface User {
  id: number;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  gender: string | null;
  dob: string | null;
  bio: string | null;
}
