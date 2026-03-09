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

export interface BulkInviteItem {
  email: string;
  role: WorkspaceRole;
}

export interface CreateBulkWorkspaceInviteRequest {
  invites: BulkInviteItem[];
}

export interface BulkInviteFailedItem {
  email: string;
  reason: string;
}

export interface BulkInviteResult {
  success: WorkspaceInvite[];
  failed: BulkInviteFailedItem[];
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
export type ProjectMemberRole = "MANAGER" | "MEMBER" | "VIEWER";
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

// ─── Workspace Join Request ───────────────────────────────────────────────────
export type WorkspaceJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface WorkspaceJoinRequest {
  id: number;
  workspaceId: number;
  user: UserSummaryResponse;
  status: WorkspaceJoinRequestStatus;
  message: string | null;
  reviewedBy: UserSummaryResponse | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceJoinRequestBody {
  message?: string;
}

export interface ReviewWorkspaceJoinRequestBody {
  status: "APPROVED" | "REJECTED";
}

export interface ReviewProjectJoinRequestBody {
  status: "APPROVED" | "REJECTED";
}

// ─── Notification ────────────────────────────────────────────────────────────
export type EntityType =
  | "WORKSPACE"
  | "PROJECT"
  | "TASK"
  | "INVITATION"
  | "COMMENT";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "WORKSPACE_INVITE"
  | "WORKSPACE_INVITE_ACCEPT"
  | "WORKSPACE_JOIN_REQUEST"
  | "WORKSPACE_REVIEW_REQUEST"
  | "WORKSPACE_REMOVE_MEMBER"
  | "WORKSPACE_ROLE_CHANGE"
  | "PROJECT_JOIN_REQUEST"
  | "COMMENT_MENTION"
  | "PROJECT_ROLE_UPDATED";

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  actorId: number | null;
  receiverId: number;
  referenceType: EntityType | null;
  referenceId: number | null;
  payload: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

// Shape of real-time message pushed via WebSocket
export interface NotificationSocketMessage {
  id: number;
  type: NotificationType;
  actorId: number | null;
  receiverId: number;
  referenceType: EntityType | null;
  referenceId: number | null;
  payload: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface DeleteNotificationsRequest {
  ids: number[];
}

// ─── Task ────────────────────────────────────────────────────────────────────
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export interface TaskResponse {
  id: number;
  projectId: number;
  parentTaskId: number | null;
  title: string;
  description: string | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  position: number | null;
  createdBy: UserSummaryResponse;
  assignees: UserSummaryResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  parentTaskId?: number;
  assigneeIds?: number[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string;
  dueDate?: string;
  position?: number;
  assigneeIds?: number[];
  parentTaskId?: number;
  removeParent?: boolean;
}

export interface TaskSearchParams {
  status?: TaskStatus;
  keyword?: string;
  cursor?: number;
  size?: number;
}
