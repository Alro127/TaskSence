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

// Team Template
export interface TeamTemplate {
  id: number;
  ownerId: number;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamTemplateRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamTemplateRequest {
  name?: string;
  description?: string;
}

// User summary (embedded in responses)
export interface UserSummaryResponse {
  id: number;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

// Team Member Template
export interface TeamMemberTemplate {
  id: number;
  teamTemplateId: number;
  userSummaryResponse: UserSummaryResponse;
  createdAt: string;
  updatedAt: string;
}

export interface AddTeamMemberTemplateRequest {
  userIds: number[];
}

export type MemberAddStatus = "ADDED" | "ALREADY_EXISTS" | "NOT_FOUND";

export interface AddTeamMemberResultItem {
  userId: number;
  status: MemberAddStatus;
}

// User search
export interface UserSearchResult {
  id: number;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

// Workspace Roles
export type WorkspaceRole = "OWNER" | "MANAGER" | "MEMBER" | "VIEWER";

// Invite Status
export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

// Workspace Member
export interface WorkspaceMember {
  id: number;
  role: WorkspaceRole;
  joinedAt: string;
  user: UserSummaryResponse;
}

// Workspace Invite
export interface WorkspaceInvite {
  id: number;
  workspaceId: number;
  email: string;
  role: WorkspaceRole;
  status: InviteStatus;
  invitedAt: string;
  expiredAt: string;
  acceptedAt: string | null;
  invitedById: number;
}

export interface CreateWorkspaceInviteRequest {
  email: string;
  role: WorkspaceRole;
}

export interface UpdateWorkspaceRoleRequest {
  role: WorkspaceRole;
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

// ─── Project ────────────────────────────────────────────────────────────────────
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED" | "ON_HOLD";
export type ProjectMemberRole = "PROJECT_MANAGER" | "MEMBER" | "VIEWER";
export type ProjectMemberAddStatus = "CREATED" | "RESTORED" | "ALREADY_EXISTS" | "NOT_FOUND";
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Project {
  id: number;
  workspaceId: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  user: UserSummaryResponse;
  role: ProjectMemberRole;
  createdAt: string;
}

export interface ProjectMemberItem {
  userId: number;
  role: ProjectMemberRole;
}

export interface AddProjectMemberRequest {
  members: ProjectMemberItem[];
}

export interface AddProjectMemberResultItem {
  userId: number;
  role: ProjectMemberRole;
  status: ProjectMemberAddStatus;
}

export interface UpdateProjectMemberRoleRequest {
  role: ProjectMemberRole;
}

export interface ProjectJoinRequest {
  id: number;
  projectId: number;
  user: UserSummaryResponse;
  status: JoinRequestStatus;
  message: string | null;
  reviewedBy: UserSummaryResponse | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface SendProjectJoinRequestBody {
  message?: string;
}

export interface ReviewProjectJoinRequestBody {
  status: "APPROVED" | "REJECTED";
}
