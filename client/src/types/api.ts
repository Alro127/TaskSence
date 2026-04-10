// API Response type matching backend ApiResponse<T>
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// Paginated response matching backend PageResponse<T>
export interface PageResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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
  projectCount?: number;
  permissions?: string[];
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
  permissions?: string[];
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
  progress?: number;
  taskCount?: number;
  permissions?: string[];
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
  permissions?: string[];
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
  | "TASK_UNASSIGNED"
  | "WORKSPACE_INVITE"
  | "WORKSPACE_INVITE_ACCEPT"
  | "WORKSPACE_JOIN_REQUEST"
  | "WORKSPACE_REVIEW_REQUEST"
  | "WORKSPACE_REMOVE_MEMBER"
  | "WORKSPACE_ROLE_CHANGE"
  | "WORKSPACE_LEAVE"
  | "PROJECT_JOIN_REQUEST"
  | "PROJECT_REVIEW_REQUEST"
  | "PROJECT_ADD_MEMBER"
  | "PROJECT_REMOVE_MEMBER"
  | "PROJECT_ROLE_CHANGE"
  | "PROJECT_LEAVE"
  | "COMMENT_MENTION"
  | "COMMENT_REACTION"
  | "COMMENT_TASK"
  | "TASK_REMINDER";

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

// ─── Sprint ───────────────────────────────────────────────────────────────────
export type SprintStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface SprintResponse {
  id: number;
  projectId: number;
  name: string;
  goal: string | null;
  taskCount: number;
  completedTaskCount: number;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintRequest {
  projectId: number;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintRequest {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────
export interface TagResponse {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTaskTagsRequest {
  tagIds: number[];
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
  tags: TagResponse[];
  sprintId: number | null;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  startDate?: string;
  dueDate?: string;
  parentTaskId?: number;
  sprintId?: number;
  assigneeIds?: number[];
  tagIds?: number[];
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
  sprintId?: number;
  removeParent?: boolean;
  removeSprint?: boolean;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface TaskSearchParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  sprintId?: number;
  tagIds?: number[];
  keyword?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  size?: number;
}

// ─── Comment ─────────────────────────────────────────────────────────────────
export interface CommentResponse {
  id: number;
  taskId: number;
  parentCommentId: number | null;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: UserSummaryResponse;
  mentions: UserSummaryResponse[];
  reactions: Record<string, number>;
}

export interface CommentCreateRequest {
  taskId: number;
  parentCommentId?: number;
  content: string;
  mentionUserIds?: number[];
}

export interface CommentUpdateRequest {
  content: string;
  mentionUserIds?: number[];
}

export interface CommentReactionRequest {
  icon: string;
}

// ─── Attachment ───────────────────────────────────────────────────────────────
export interface AttachmentResponse {
  id: number;
  taskId: number;
  uploaderId: number;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttachmentFileInfo {
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export interface CreateAttachmentsRequest {
  taskId: number;
  files: CreateAttachmentFileInfo[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface DayCount {
  date: string;
  count: number;
}

export interface SprintVelocity {
  sprintId: number;
  completedCount: number;
}

export interface MemberPerformance {
  userId: number;
  assignedCount: number;
  completedCount: number;
  overdueCount: number;
  performanceScore: number;
}

export interface ProjectAnalyticsResponse {
  totalTasks: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  overdueCount: number;
  completionTrend: DayCount[];
  healthScore: number;
  projectedCompletionDate: string | null;
  avgDailyVelocity: number;
  sprintVelocity: SprintVelocity[];
  memberPerformance: MemberPerformance[];
}

export interface AIAgentSourceRelation {
  workspace?: { id: number; name: string };
  project?: { id: number; name: string; status: string };
  sprint?: { id: number; name: string };
}

export interface AIAgentSource {
  id: string;
  index: "tasks" | "projects" | "sprints" | string;
  relation: AIAgentSourceRelation | null;
}

export interface AIAgentResponse {
  answer: string;
  sources: AIAgentSource[];
  sessionId: number | null;
}

export interface AISession {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string | null;
}

export interface AISessionDetail extends AISession {
  user_id: number;
}

export interface AISessionMessage {
  id: number;
  session_id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  context: unknown | null;
  sources: unknown | null;
  created_at: string;
}

export interface InitAISessionRequest {
  title?: string;
}
