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

export interface TokenRequest {
  token: string;
}

export interface GoogleLoginRequest {
  code: string;
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
  token: string;
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
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  bio?: string;
  avatarUrl?: string;
}

// Workspace
export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

// User Skills
export interface UserSkill {
  id: number;
  skillName: string;
  level: number; // 1-5
}

export interface UserSkillRequest {
  skillName: string;
  level: number; // 1-5
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// Mock project (until Project API is implemented)
export interface MockProject {
  id: number;
  name: string;
  description: string;
  taskCount: number;
  completedTaskCount: number;
  status: "active" | "archived" | "completed";
  updatedAt: string;
}
