# TaskSense - Frontend Project Context

> File này dùng để giữ context cho AI và developers. Cập nhật sau mỗi sprint/thay đổi lớn.
> **Cập nhật lần cuối**: Sprint 13 — Leave Project / Leave Workspace

## 📋 Thông tin dự án

- **Tên dự án**: TaskSense - Hệ thống quản lý công việc và hiệu suất
- **Frontend Stack**: React 19 + Vite 7 + TypeScript 5.9
- **UI Library**: shadcn/ui + Tailwind CSS v4
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod validation
- **Toast**: Sonner (shadcn/ui integration)
- **WebSocket**: @stomp/stompjs (STOMP over WebSocket)

## 🏗️ Backend API

- **Base URL**: `http://localhost:8080/api/v1`
- **Auth Endpoints**:
  - `POST /auth/register` → body: `{email, password}` → gửi OTP email
  - `POST /auth/verify-otp?email=...&otp=...` → `{accessToken, refreshToken}`
  - `POST /auth/login/local` → body: `{email, password}` → `{accessToken, refreshToken}`
  - `POST /auth/login/google?code=...` → `{accessToken, refreshToken}`
  - `POST /auth/forgot-password?email=...` → gửi email reset password
  - `POST /auth/reset-password` → body: `{token, newPassword}` → reset password
  - `POST /auth/logout` → body: `{token}` (refresh token)
- **Media Endpoints**:
  - `POST /media/presign/avatar` → body: `{fileName, extension}` → `{uploadUrl, objectKey, fileUrl}` - lấy presigned URL để upload avatar lên S3
  - `POST /media/presign/document` → body: `{fileName, extension}` → `{uploadUrl, objectKey, fileUrl}` - lấy presigned URL để upload document lên S3
- **User Endpoints**:
  - `GET /users/me` → lấy thông tin user hiện tại
  - `PUT /users/me` → body: `{fullName?, phone?, gender?, dob?, bio?, avatarUrl?}` → update full profile (support avatar)
  - `GET /users/:id` → lấy thông tin đầy đủ của user khác (dùng cho UserProfileDrawer)
  - `GET /users/search?keyword=...` → tìm kiếm user theo tên/email → `UserSearchResult[]`
- **Workspace Endpoints**:
  - `POST /workspaces` → body: `{name, description?}` → `WorkspaceResponse`
  - `GET /workspaces` → danh sách workspace của current user
  - `GET /workspaces/:id` → chi tiết 1 workspace
  - `PUT /workspaces/:id` → body: `{name?, description?}` → `WorkspaceResponse`
  - `DELETE /workspaces/:id` → xóa workspace
- **Workspace Member Endpoints**:
  - `GET /workspaces/:id/members` → danh sách members (embed `UserSummaryResponse`)
  - `PATCH /workspaces/:id/members/:memberId` → body: `{role}` → update role
  - `DELETE /workspaces/:id/members/:memberId` → xóa member
  - `DELETE /workspaces/:workspaceId/leave` → rời workspace (current user tự rời)
- **Workspace Invite Endpoints**:
  - `POST /workspaces/:id/invites` → body: `{email, role}` → gửi email mời (single)
  - `POST /workspaces/:id/invites/bulk` → body: `{invites: [{email, role}]}` → `BulkInviteResult` (batch)
  - `GET /workspaces/:id/invites` → danh sách invites của workspace
  - `POST /workspaces/invites/accept` → body: `{token}` → accept invite
  - `PATCH /workspaces/invites/:inviteId/revoke` → revoke invite
- **User Skill Endpoints**:
  - `GET /users/me/skills` → danh sách skill của current user
  - `GET /users/:userId/skills` → danh sách skill của user khác (view-only)
  - `POST /users/me/skills` → body: `{skillName, level (1-5)}` → `UserSkillResponse`
  - `PUT /users/me/skills/:skillId` → body: `{skillName, level}` → `UserSkillResponse`
  - `DELETE /users/me/skills/:skillId` → xóa skill
- **Project Endpoints**:
  - `GET /workspaces/:workspaceId/projects` → danh sách projects trong workspace → `Project[]`
  - `GET /workspaces/:workspaceId/projects/:projectId` → chi tiết project → `Project`
  - `POST /workspaces/:workspaceId/projects` → body: `{name, description?, status?, startDate?, endDate?}` → `Project`
  - `PUT /workspaces/:workspaceId/projects/:projectId` → body: `UpdateProjectRequest` → `Project`
  - `DELETE /workspaces/:workspaceId/projects/:projectId` → xóa project
  - `GET /projects/:projectId/members/me/role` → lấy role của current user trong project → `ProjectMemberRole`
- **Project Member Endpoints**:
  - `GET /projects/:projectId/members` → danh sách members (embed `UserSummaryResponse`) → `ProjectMember[]`
  - `POST /projects/:projectId/members` → body: `{members: [{userId, role}]}` → `AddProjectMemberResultItem[]`
  - `PATCH /projects/:projectId/members/:userId/role` → body: `{role}` → `ProjectMember`
  - `DELETE /projects/:projectId/members/:userId` → xóa member
  - `DELETE /workspaces/:workspaceId/projects/:projectId/leave` → rời project (current user tự rời)
- **Project Join Request Endpoints**:
  - `POST /projects/:projectId/join-requests` → body: `{message?}` → `ProjectJoinRequest`
  - `GET /projects/:projectId/join-requests` → danh sách join requests → `ProjectJoinRequest[]`
  - `PATCH /projects/:projectId/join-requests/:requestId/review` → body: `{status: "APPROVED"|"REJECTED"}` → `ProjectJoinRequest`
  - `DELETE /projects/:projectId/join-requests/:requestId` → huỷ join request
- **Sprint Endpoints**:
  - `POST /sprints` → body: `{projectId, name, goal?, startDate, endDate}` → `SprintResponse`
  - `PUT /sprints/:sprintId` → body: `{name, goal?, startDate?, endDate?}` → `SprintResponse`
  - `DELETE /sprints/:sprintId` → xóa mềm sprint
  - `GET /sprints/project/:projectId?page=&size=` → danh sách sprint theo project (paged) → `PageResponse<SprintResponse>`
- **Task Endpoints**:
  - `POST /projects/:projectId/tasks` → body: `CreateTaskRequest` → `TaskResponse` _(MANAGER, MEMBER)_
  - `GET /projects/:projectId/tasks` → danh sách tasks của project (pageable) → `PageResponse<TaskResponse>` _(tất cả roles)_
  - `GET /projects/:projectId/tasks/search?status=&priority=&assigneeId=&keyword=&dueDateFrom=&dueDateTo=&page=&size=` → tìm kiếm task (page + size, chưa hỗ trợ `sprintId`/`tagIds`) → `TaskResponse[]` _(tất cả roles)_
  - `GET /projects/:projectId/tasks/:taskId` → chi tiết task → `TaskResponse` _(tất cả roles)_
  - `GET /projects/:projectId/tasks/:taskId/subtasks` → danh sách subtask (pageable) → `PageResponse<TaskResponse>` _(tất cả roles)_
  - `PUT /projects/:projectId/tasks/:taskId` → body: `UpdateTaskRequest` → `TaskResponse` _(MANAGER: bất kỳ task; MEMBER: chỉ task mình tạo)_
  - `PATCH /projects/:projectId/tasks/:taskId/status` → body: `{status}` → `TaskResponse` _(MANAGER: bất kỳ; MEMBER: task mình tạo hoặc được assign)_
  - `DELETE /projects/:projectId/tasks/:taskId` → xóa task (soft delete) _(MANAGER: bất kỳ; MEMBER: chỉ task mình tạo)_
- **Comment Endpoints**:
  - `POST /comments` → body: `{taskId, parentCommentId?, content, mentionUserIds?}` → `CommentResponse` _(tạo comment hoặc reply)_
  - `PUT /comments/:commentId` → body: `{content, mentionUserIds?}` → `CommentResponse` _(chỉ owner)_
  - `DELETE /comments/:commentId` → xóa comment _(owner hoặc MANAGER)_
  - `GET /comments/task/:taskId?cursor=&limit=` → danh sách comments (cursor-based) → `CommentResponse[]`
  - `POST /comments/:commentId/reactions` → body: `{icon}` → thêm reaction _(lần đầu hoặc khi icon mới)_
  - `DELETE /comments/:commentId/reactions` → body: `{icon}` → xóa reaction
  - `PATCH /comments/:commentId/reactions` → body: `{icon}` → upsert/switch reaction _(1 request khi đổi icon)_
  - `GET /comments/:commentId/reactions/:icon` → danh sách users đã thả icon → `UserSummaryResponse[]`
- **Workspace Join Request Endpoints**:
  - `POST /workspaces/:workspaceId/join-requests` → body: `{message?}` → `WorkspaceJoinRequest`
  - `GET /workspaces/:workspaceId/join-requests` → danh sách join requests (OWNER/MANAGER) → `WorkspaceJoinRequest[]`
  - `PATCH /workspaces/:workspaceId/join-requests/:requestId/review` → body: `{status: "APPROVED"|"REJECTED"}` → `WorkspaceJoinRequest`
  - `DELETE /workspaces/:workspaceId/join-requests/:requestId` → huỷ join request
- **Workspace Explore Endpoints**:
  - `GET /workspaces/search?name=...&cursor=...&limit=...` → tìm kiếm public workspaces → `WorkspaceResponse[]`
  - `GET /workspaces/public/:userId?page=0&size=10&sort=createdAt,desc` → danh sách public workspaces của user khác (pageable) → `PageResponse<WorkspaceResponse>`
- **Notification Endpoints**:
  - `GET /notifications/unread-count` → số thông báo chưa đọc → `number`
  - `POST /notifications/:id/read` → đánh dấu 1 thông báo là đã đọc
  - `POST /notifications/read-all` → đánh dấu tất cả là đã đọc → số lượng đã update
  - `DELETE /notifications/:id` → xóa 1 thông báo
  - `DELETE /notifications` → body: `{ids: number[]}` → xóa nhiều thông báo
- **Analytics Endpoints**:
  - `GET /projects/:projectId/analytics` → `ProjectAnalyticsResponse` _(VIEW_TASKS permission)_
- **WebSocket**: `ws://localhost:8080/api/v1/ws` (STOMP)
  - Connect header: `Authorization: Bearer <accessToken>`
  - Subscribe: `/user/queue/notifications` → nhận `NotificationSocketMessage` real-time
  - Backend route message theo `receiverEmail` (principal name = email từ JWT `sub`)
- **API Response format**: `{code: string, message: string, data: T}`
- **CORS allowed**: `http://localhost:5173`
- **JWT**: Access Token + Refresh Token
- **context-path**: `/api/v1`

## 🗂️ Cấu trúc thư mục FE (hiện tại)

```text
client/
├── src/
│   ├── app/
│   │   ├── store.ts          ← Đã thêm notificationApi + notificationReducer + taskApi + commentApi + analyticsApi
│   │   └── hooks.ts
│   ├── components/
│   │   ├── ui/               ← Đã thêm: dialog, dropdown-menu, tabs, badge, sheet
│   │   └── common/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/authApi.ts
│   │   │   ├── pages/
│   │   │   └── authSlice.ts
│   │   ├── dashboard/
│   │   │   └── pages/DashboardPage.tsx
│   │   ├── notification/                  ← Sprint 8 + Sprint 9 — HOÀN THÀNH
│   │   │   ├── api/
│   │   │   │   └── notificationApi.ts     ← RTK Query: 6 endpoints
│   │   │   ├── components/
│   │   │   │   ├── NotificationDropdown.tsx ← Bell icon + dropdown panel (infinite scroll)
│   │   │   │   └── NotificationItem.tsx   ← Single notification row; safe date parse guard
│   │   │   ├── hooks/
│   │   │   │   └── useNotificationSocket.ts ← STOMP; createdAt fallback cho WebSocket push
│   │   │   ├── utils/
│   │   │   │   └── notificationUtils.ts   ← getNotificationText(), getNotificationTarget(); hỗ trợ WORKSPACE_REVIEW_REQUEST
│   │   │   ├── notificationSlice.ts       ← Redux: realtimeItems, unreadCount, bellAnimating
│   │   │   └── index.ts
│   │   ├── user/
│   │   │   ├── api/
│   │   │   │   ├── userApi.ts             ← getUserById trả về ApiResponse<User> (đầy đủ fields)
│   │   │   │   └── userSkillApi.ts        ← RTK Query CRUD cho skills
│   │   │   ├── components/
│   │   │   │   ├── AvatarUpload.tsx
│   │   │   │   ├── SkillStars.tsx         ← ★ Star rating (display + interactive)
│   │   │   │   ├── SkillsSection.tsx      ← Skills tab: list + inline add/edit
│   │   │   │   ├── UserProfileCard.tsx
│   │   │   │   └── UserProfileDrawer.tsx  ← Sheet xem profile người khác; tab Workspaces (Sprint 9)
│   │   │   ├── hooks/
│   │   │   │   └── useAvatarUpload.ts
│   │   │   ├── pages/
│   │   │   │   ├── EditProfilePage.tsx    ← Redirect về /profile (backward compat)
│   │   │   │   └── ProfilePage.tsx        ← /profile (2 tabs: Info + Skills)
│   │   │   └── userSlice.ts
│   │   ├── workspace/
│   │   │   ├── api/
│   │   │   │   ├── workspaceApi.ts           ← RTK Query CRUD + searchWorkspaces + getPublicWorkspaces
│   │   │   │   ├── workspaceMemberApi.ts      ← RTK Query member management
│   │   │   │   ├── workspaceInviteApi.ts      ← RTK Query invite management
│   │   │   │   └── workspaceJoinRequestApi.ts ← RTK Query join request (Sprint 9)
│   │   │   ├── workspaceSlice.ts          ← pinnedIds + recentIds (localStorage)
│   │   │   ├── components/
│   │   │   │   ├── WorkspaceCard.tsx
│   │   │   │   ├── WorkspaceCardGhost.tsx
│   │   │   │   ├── CreateWorkspaceModal.tsx
│   │   │   │   ├── EditWorkspaceModal.tsx
│   │   │   │   ├── DeleteWorkspaceDialog.tsx  ← Type-to-confirm
│   │   │   │   ├── InviteMemberModal.tsx      ← Single invite (kept, replaced by BulkInviteModal)
│   │   │   │   ├── BulkInviteModal.tsx        ← Bulk invite: search + email + template import
│   │   │   │   ├── WorkspaceMembersTab.tsx    ← Members + Pending Invites + Join Requests
│   │   │   │   ├── WorkspaceExploreCard.tsx   ← Card dùng trong Explore page (Sprint 9)
│   │   │   │   ├── JoinRequestDialog.tsx      ← Confirm dialog gửi join request (Sprint 9)
│   │   │   │   └── index.ts
│   │   │   └── pages/
│   │   │       ├── WorkspacesPage.tsx          ← /workspaces
│   │   │       ├── WorkspaceDetailPage.tsx     ← /workspaces/:id (hỗ trợ ?tab= query param)
│   │   │       ├── WorkspaceInvitationPage.tsx ← /workspaces/invitation?token=...
│   │   │       ├── WorkspaceExplorePage.tsx    ← /workspaces/explore (Sprint 9)
│   │   │       └── index.ts
│   │   ├── project/                       ← Sprint 7 — HOÀN THÀNH
│   │   │   ├── api/
│   │   │   │   ├── projectApi.ts          ← RTK Query CRUD + getCurrentUserRole
│   │   │   │   ├── projectMemberApi.ts    ← RTK Query member management (incl. leaveProject)
│   │   │   │   └── projectJoinRequestApi.ts ← RTK Query join request management
│   │   │   ├── components/
│   │   │   │   ├── ProjectCard.tsx        ← Card + STATUS_CONFIG + ROLE_LABEL exports
│   │   │   │   ├── ProjectCardGhost.tsx   ← Ghost "New Project" card
│   │   │   │   ├── EditProjectModal.tsx   ← Edit project dialog (name, desc, status, dates)
│   │   │   │   ├── DeleteProjectDialog.tsx← Type-to-confirm delete
│   │   │   │   ├── MemberCard.tsx         ← Member card với role badge + change role/remove
│   │   │   │   ├── SprintManagementTab.tsx← Sprint tab: CRUD + compact cards + timeline + deep-link task board
│   │   │   │   ├── AddMembersModal.tsx    ← Thêm member từ workspace members list
│   │   │   │   └── index.ts
│   │   │   └── pages/
│   │   │       ├── CreateProjectPage.tsx  ← /workspaces/:id/projects/new (full form)
│   │   │       ├── ProjectDetailPage.tsx  ← /workspaces/:id/projects/:projectId (5 tabs: + Sprints)
│   │   │       └── index.ts
│   │   ├── sprint/
│   │   │   └── api/
│   │   │       └── sprintApi.ts           ← RTK Query Sprint CRUD + list by project
│   │   ├── analytics/                     ← Sprint 12 — HOÀN THÀNH
│   │   │   ├── api/
│   │   │   │   └── analyticsApi.ts        ← RTK Query: getProjectAnalytics(projectId)
│   │   │   └── components/
│   │   │       └── ProjectAnalyticsTab.tsx← Dashboard analytics tab: 6 sections, recharts
│   │   ├── task/                            ← Sprint 9 FE — Task Board & Detail | Sprint 10 — Comments
│   │   │   ├── api/
│   │   │   │   ├── taskApi.ts              ← RTK Query: 8 endpoints (CRUD + search + subtasks + updateTaskStatus)
│   │   │   │   └── commentApi.ts           ← RTK Query: 8 endpoints (CRUD + reactions add/remove/update + getReactionUsers)
│   │   │   ├── components/
│   │   │   │   ├── TaskFormSheet.tsx        ← Sheet tạo/sửa task (RHF + Zod)
│   │   │   │   ├── CommentInput.tsx         ← Textarea + @mention dropdown (Ctrl+Enter submit)
│   │   │   │   ├── CommentItem.tsx          ← Comment row: reactions (optimistic + 1-per-user + hover tooltip), 1-level reply, edit/delete
│   │   │   │   └── CommentSection.tsx       ← Container: cursor pagination, load more, groups top-level+replies
│   │   │   └── pages/
│   │   │       ├── TaskBoardPage.tsx        ← Kanban board (drag-and-drop) + List view
│   │   │       ├── TaskDetailPage.tsx       ← Chi tiết task + inline edit + subtasks + CommentSection
│   │   │       └── index.ts
│   │   └── team-template/
│   │       ├── api/
│   │       │   ├── teamTemplateApi.ts     ← RTK Query CRUD
│   │       │   └── teamMemberTemplateApi.ts← RTK Query members
│   │       ├── components/
│   │       │   ├── TeamTemplateCard.tsx
│   │       │   ├── TeamTemplateCardGhost.tsx
│   │       │   ├── CreateTeamTemplateModal.tsx
│   │       │   ├── EditTeamTemplateModal.tsx
│   │       │   ├── DeleteTeamTemplateDialog.tsx ← Type-to-confirm
│   │       │   ├── AddMembersModal.tsx    ← Search + batch add
│   │       │   └── index.ts
│   │       └── pages/
│   │           ├── TeamTemplatesPage.tsx  ← /team-templates
│   │           ├── TeamTemplateDetailPage.tsx ← /team-templates/:id
│   │           └── index.ts
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   └── MainLayout.tsx    ← Sidebar với nav items (incl. "Explore" Compass icon); profile drawer từ header
│   ├── routes/index.tsx      ← Đã thêm /workspaces/explore + /workspaces/:id/projects/* + tab-aware navigation
│   ├── types/api.ts          ← Đầy đủ tất cả types: Auth, User, Workspace, WorkspaceMember/Invite,
   │                            WorkspaceJoinRequest, TeamTemplate, Project, ProjectMember, ProjectJoinRequest,
   │                            Task (incl. UpdateTaskStatusRequest), UserSkill,
   │                            Notification (incl. WORKSPACE_REVIEW_REQUEST, WORKSPACE_LEAVE, PROJECT_LEAVE),
   │                            Comment (CommentResponse, CommentCreateRequest, CommentUpdateRequest, CommentReactionRequest),
   │                            Analytics (DayCount, SprintVelocity, MemberPerformance, ProjectAnalyticsResponse)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── DESIGN_SYSTEM.md
└── PROJECT_CONTEXT.md
```

## 🚀 Sprint Progress

### Sprint 1 - Authentication ✅ COMPLETED

- ✅ Login (local + Google OAuth)
- ✅ Register + Verify OTP
- ✅ Forgot Password
- ✅ Reset Password
- ✅ Logout

### Sprint 2 - Dashboard & Profile Layout ✅ COMPLETED

- ✅ Dashboard ưu tiên task management UI
- ✅ Kanban mini mock (`To Do / Doing / Done`) bằng mock cards
- ✅ Sidebar đầy đủ icon + label cho quick access
- ✅ Profile di dời khỏi dashboard content
- ✅ Profile drawer mở từ avatar button ở header (bên phải)
- ✅ Trang `Edit Profile` riêng (`/dashboard/edit-profile`)
- ✅ Mock pages cho quick access: `tasks`, `calendar`, `analytics`, `settings`
- ✅ **Avatar Upload** - FE integration
  - ✅ Created `useAvatarUpload` hook for S3 upload logic
  - ✅ Created `AvatarUpload` component (square 1:1 preview + upload)
  - ✅ Integrated avatar upload into EditProfilePage
  - ✅ File validation (5MB max, JPG/PNG/WebP only)
  - ✅ Preview display before confirming upload
  - ✅ Loading spinner during S3 upload
- ⏳ Chờ backend user endpoints để bỏ mock data

### Sprint 4 - User Skills & Profile Refactor ✅ COMPLETED

- ✅ **User Skill API** — RTK Query (`userSkillApi`) với 5 endpoints: getMySkills, getUserSkills, addSkill, updateSkill, deleteSkill
- ✅ **SkillStars component** — hiển thị 1–5 sao; có thể interactive (clickable) hoặc display-only theo prop `onChange`
- ✅ **SkillsSection component** — Skills tab content với:
  - List skills kèm rank number + ★ stars + label (Beginner → Expert)
  - Hover row → hiện icon ✏️ / 🗑️
  - Click ✏️ → inline edit row tại chỗ (expand in-place)
  - Nút "Add Skill" → inline add form ở cuối list
  - Hỗ trợ cả **own profile** (full CRUD) và **view-only** khi truyền `userId` prop
- ✅ **ProfilePage** (`/profile`) — refactor thành 2 tabs:
  - **Info tab**: giữ nguyên nội dung form profile (avatar + fields). `Save Changes` chỉ enable khi `isDirty` hoặc có avatar mới. Nút "Discard" để reset form.
  - **Skills tab**: `SkillsSection` component
- ✅ Route `/dashboard/edit-profile` → redirect sang `/profile` (backward compat)
- ✅ Sidebar "Profile" → `/profile`
- ✅ Cập nhật **types/api.ts** thêm `UserSkill`, `UserSkillRequest`
- ✅ Cập nhật **store.ts** thêm `userSkillApi` reducer + middleware

### Sprint 3 - Workspace CRUD ✅ COMPLETED

- ✅ **Workspace API** — RTK Query (`workspaceApi`) với đầy đủ CRUD endpoints
- ✅ **workspaceSlice** — quản lý `pinnedIds` + `recentIds` persistent qua `localStorage`
- ✅ **WorkspacesPage** (`/workspaces`) với 3 sections:
  - Pinned (manual pin bởi user)
  - Recent (auto-track 5 workspace gần nhất)
  - All workspaces + ghost card "New Workspace"
- ✅ **WorkspaceDetailPage** (`/workspaces/:id`) gồm 3 tabs:
  - **Projects**: mock 5 project mẫu với progress bar + status badge
  - **Members**: placeholder (chờ sprint sau)
  - **Settings**: inline edit form (name, description) + Danger Zone (delete)
- ✅ **CreateWorkspaceModal** — quick create dialog (name + description, RHF + Zod)
- ✅ **EditWorkspaceModal** — edit dialog pre-filled
- ✅ **DeleteWorkspaceDialog** — type-to-confirm (user gõ tên workspace, paste bị chặn)
- ✅ **Dashboard WorkspaceSection** — hiển thị 3 workspace gần nhất + View All link
- ✅ Cập nhật **Sidebar** thêm mục "Workspaces" (`FolderKanban` icon)
- ✅ Cập nhật **routes** thêm `/workspaces` và `/workspaces/:id`
- ✅ Cập nhật **types/api.ts** thêm `Workspace`, `CreateWorkspaceRequest`, `UpdateWorkspaceRequest`, `MockProject`
- ✅ Cài thêm **shadcn/ui components**: `dialog`, `dropdown-menu`, `tabs`, `badge`

### Sprint 6 - Workspace Members & Invites ✅ COMPLETED

- ✅ **Types** — thêm vào `types/api.ts`:
  - `WorkspaceRole` type: `'OWNER' | 'MANAGER' | 'MEMBER' | 'VIEWER'`
  - `InviteStatus` type: `'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'`
  - `WorkspaceMember` — embed `UserSummaryResponse`, có `role`, `joinedAt`
  - `WorkspaceInvite` — `email`, `role`, `status`, `invitedAt`, `expiredAt`, `acceptedAt`
  - `CreateWorkspaceInviteRequest`, `UpdateWorkspaceRoleRequest`
- ✅ **workspaceMemberApi** — RTK Query với 4 endpoints: `getWorkspaceMembers`, `updateMemberRole`, `removeMember`, `leaveWorkspace`
- ✅ **workspaceInviteApi** — RTK Query với 5 endpoints: `getWorkspaceInvites`, `inviteMember`, `acceptInvite`, `revokeInvite`, `bulkInviteMembers`
- ✅ **WorkspaceMembersTab** (`features/workspace/components/WorkspaceMembersTab.tsx`):
  - Section **Members**: list tất cả members với avatar, tên, email, role badge
  - Click avatar/tên → mở `UserProfileDrawer` (reuse pattern từ Team Template)
  - 3-dot menu per row (chỉ hiện nếu current user có quyền manage member đó):
    - **Change Role**: submenu với danh sách roles → gọi `PATCH` API ngay
    - **Remove**: mở confirmation Dialog
  - Section **Pending Invitations** (chỉ OWNER/MANAGER thấy): list pending invites với nút Revoke
  - Nút **Invite Member** (chỉ OWNER/MANAGER): mở `BulkInviteModal`
  - Nút **Leave Workspace** (outline/destructive, hiện cho tất cả members): mở confirmation dialog → gọi `leaveWorkspace` → navigate về `/workspaces`; block nếu là OWNER duy nhất (409 từ backend)
  - Permission logic: OWNER manage tất cả; MANAGER manage MEMBER/VIEWER; không được tự manage mình
- ✅ **InviteMemberModal** — giữ lại trong codebase (không xóa), hiện được thay bằng `BulkInviteModal`

### Sprint 6.1 - Bulk Invite ✅ COMPLETED

- ✅ **Types mới** — thêm vào `types/api.ts`:
  - `BulkInviteItem` — `{email, role}`
  - `CreateBulkWorkspaceInviteRequest` — `{invites: BulkInviteItem[]}`
  - `BulkInviteFailedItem` — `{email, reason}` (backend trả về khi invite lỗi)
  - `BulkInviteResult` — `{success: WorkspaceInvite[], failed: BulkInviteFailedItem[]}`
- ✅ **`bulkInviteMembers`** endpoint thêm vào `workspaceInviteApi` — `POST /workspaces/:id/invites/bulk`
- ✅ **BulkInviteModal** (`features/workspace/components/BulkInviteModal.tsx`) — Dialog 2-cột (`max-w-2xl`):
  - **Cột trái “Add People”**:
    - Search user theo tên/email (debounce 350ms, `GET /users/search`) → click `+` thêm vào list
    - Click tên/avatar → mở `UserProfileDrawer`
    - Direct email add: nhập email hợp lệ (kể cả chưa đăng ký) → Enter hoặc click “Invite [email]”
    - Collapsible **Import from Team Template**:
      - Dropdown chọn template (lấy từ `useGetMyTemplatesQuery`)
      - Checkbox list các member của template (`useGetMembersQuery`)
      - Toggle Select all / Deselect all
      - Nút “Add Selected (N)” thêm vào invite list
      - Member đã có trong list → disabled + “Added” label (deduplication theo email)
  - **Cột phải “Invite List”**:
    - Header: **Default role** (Select, dashed border) — apply cho người mới thêm; thay đổi default → tự động update những người đang có role cũ
    - Mỗi row: avatar │ tên + email │ `RoleSelect` inline (h-7, w-28) │ nút `×` xóa
    - Empty state khi list trống
  - **Footer**: Cancel + “Send N Invitations” (disabled khi list trống)
  - **Result view** sau khi submit: hiển success list (green) + failed list (red) với lý do từ backend
- ✅ `WorkspaceMembersTab` — cập nhật dùng `BulkInviteModal` thay `InviteMemberModal`
- ✅ **WorkspaceInvitationPage** (`/workspaces/invitation?token=...`):
  - Nếu chưa auth → redirect `/auth/login?redirect=...`
  - Idle state: card với thông tin invite + nút Accept/Decline
  - Loading state: spinner trên nút Accept
  - Success state: green checkmark + nút điều hướng về workspace
  - Error state: red X + thông báo lỗi
- ✅ Cập nhật **WorkspaceDetailPage**: thay Members tab placeholder bằng `WorkspaceMembersTab`
- ✅ Cập nhật **store.ts**: thêm `workspaceMemberApi` + `workspaceInviteApi`
- ✅ Cập nhật **routes**: thêm `/workspaces/invitation` (trước `:id` để tránh conflict)

### Sprint 5 - Team Template ✅ COMPLETED

- ✅ **Types** — thêm vào `types/api.ts`:
  - `TeamTemplate` — bao gồm `memberCount: number` (backend tính sẵn, dùng để hiển thị trên card)
  - `UserSummaryResponse` — embedded user info (id, email, fullName, avatarUrl)
  - `TeamMemberTemplate` — dùng `userSummaryResponse: UserSummaryResponse` (backend embed sẵn, **không** có `userId` riêng)
  - `AddTeamMemberTemplateRequest`, `AddTeamMemberResultItem`, `MemberAddStatus`
  - `UserSearchResult`
- ✅ **teamTemplateApi** — RTK Query với 5 endpoints: `getMyTemplates`, `getTemplateById`, `createTemplate`, `updateTemplate`, `deleteTemplate`
- ✅ **teamMemberTemplateApi** — RTK Query với 3 endpoints: `getMembers`, `addMembers` (batch), `removeMember`
- ✅ **User Search** — thêm `searchUsers` + `useLazySearchUsersQuery` vào `userApi` (`GET /users/search?keyword=...`)
- ✅ **TeamTemplatesPage** (`/team-templates`):
  - Grid card layout giống WorkspacesPage
  - Empty state + ghost card "New Template"
  - Create / Edit / Delete modal integration
- ✅ **TeamTemplateDetailPage** (`/team-templates/:id`) gồm 2 tabs:
  - **Members tab**: hiển thị `fullName` làm title, `email` làm subtitle — đọc trực tiếp từ `member.userSummaryResponse` (backend embed), không gọi thêm API. Add Members button, Remove per-row
  - **Settings tab**: inline edit form (name, description) + Danger Zone (delete + navigate back)
- ✅ **AddMembersModal** — search user by name/email (debounced 400ms, `GET /users/search?keyword=`), multi-select chips, batch add (`POST /team-templates/:id/members/batch`), hiển thị kết quả ADDED / ALREADY_EXISTS / NOT_FOUND per user. Mỗi row trong search results tách thành 2 vùng click: click tên/avatar → xem profile; click nút `+` → thêm vào selection
- ✅ **DeleteTeamTemplateDialog** — type-to-confirm, có `navigateAfterDelete` prop cho detail page
- ✅ **UserProfileDrawer** — Sheet xem profile người khác (read-only), mở từ:
  - Click avatar/tên trong **MembersTab** (danh sách thành viên đã thêm)
  - Click avatar/tên trong **AddMembersModal** (search results khi đang tìm kiếm)
  - Nội dung: 2 tabs — **Info** (bio, email, phone, gender, dob) + **Skills** (view-only `SkillsSection`)
- ✅ Cài thêm **shadcn/ui components**: `sheet`
- ✅ Cập nhật **store.ts** thêm `teamTemplateApi` + `teamMemberTemplateApi`
- ✅ Cập nhật **routes** thêm `/team-templates` và `/team-templates/:id`
- ✅ Cập nhật **Sidebar** thêm mục "Team Templates" (`Users` icon)

#### Backend API — Team Template

| Method   | Endpoint                              | Mô tả                                          |
| -------- | ------------------------------------- | ---------------------------------------------- |
| `GET`    | `/team-templates`                     | Danh sách template của current user            |
| `GET`    | `/team-templates/:id`                 | Chi tiết template                              |
| `POST`   | `/team-templates`                     | Tạo template mới                               |
| `PUT`    | `/team-templates/:id`                 | Cập nhật template                              |
| `DELETE` | `/team-templates/:id`                 | Xóa template                                   |
| `GET`    | `/team-templates/:id/members`         | Danh sách member (embed `UserSummaryResponse`) |
| `POST`   | `/team-templates/:id/members/batch`   | Thêm nhiều member cùng lúc                     |
| `DELETE` | `/team-templates/:id/members/:userId` | Xóa member khỏi template                       |

### Sprint 5.1 - View Member Profile ✅ COMPLETED

- ✅ **UserProfileDrawer** (`features/user/components/UserProfileDrawer.tsx`) — Sheet read-only xem thông tin người dùng khác:
  - Props: `userId: number | null`, `open: boolean`, `onClose: () => void`
  - Fetch `GET /users/:id` (RTK Query `useGetUserByIdQuery` với skip khi `userId` null)
  - 2 tabs: **Info** (bio, email, phone, gender, dob) + **Skills** (reuse `<SkillsSection userId={...} />`)
  - Loading/error states
- ✅ **getUserById** type fix: từ `ApiResponse<UserSearchResult>` → `ApiResponse<User>` (đầy đủ fields: bio, phone, gender, dob)
- ✅ **MembersTab** — click avatar hoặc tên → mở `UserProfileDrawer`; hiển thị `avatarUrl` thực nếu có
- ✅ **AddMembersModal** — tách mỗi row search results thành 2 zone: click tên/avatar → mở `UserProfileDrawer`; click nút `+` → thêm vào selection chips
- ✅ Cài thêm **shadcn/ui**: `sheet`

### Sprint 8 - Notification System ✅ COMPLETED

- ✅ **Types** — thêm vào `types/api.ts`:
  - `EntityType` type: `'WORKSPACE' | 'PROJECT' | 'TASK' | 'INVITATION' | 'COMMENT'`
  - `NotificationType` type: 11 loại — `TASK_ASSIGNED`, `WORKSPACE_INVITE`, `WORKSPACE_INVITE_ACCEPT`, `WORKSPACE_JOIN_REQUEST`, `WORKSPACE_REMOVE_MEMBER`, `WORKSPACE_ROLE_CHANGE`, `PROJECT_JOIN_REQUEST`, `COMMENT_MENTION`, `PROJECT_ROLE_UPDATED`, `WORKSPACE_LEAVE`, `PROJECT_LEAVE`
  - `NotificationResponse` — `id, type, actorId, receiverId, referenceType (EntityType), referenceId, payload, read, createdAt`
  - `NotificationSocketMessage` — cùng shape với `NotificationResponse` (backend có `id`)
  - `DeleteNotificationsRequest` — `{ids: number[]}`
- ✅ **notificationApi** — RTK Query với 6 endpoints:
  - `getNotifications` — cursor-based pagination (`cursor`, `limit=10`), tag `Notification`
  - `getUnreadCount` — tag `UnreadCount`
  - `markAsRead` — invalidate `UnreadCount`
  - `markAllAsRead` — invalidate `Notification` + `UnreadCount`
  - `deleteNotification` — invalidate `Notification` + `UnreadCount`
  - `deleteNotifications` — bulk delete, invalidate tương tự
- ✅ **notificationSlice** — Redux state gồm:
  - `realtimeItems: NotificationResponse[]` — items push qua WebSocket (newest first)
  - `unreadCount: number` — badge số đỏ trên bell
  - `bellAnimating: boolean` — trigger animation khi có notification mới
  - Actions: `pushRealtimeNotification`, `setUnreadCount`, `decrementUnreadCount`, `clearUnreadCount`, `markRealtimeItemRead`, `markAllRealtimeItemsRead`, `removeRealtimeItem`, `triggerBellAnimation`, `stopBellAnimation`, `clearNotifications`
- ✅ **useNotificationSocket** hook:
  - Persistent STOMP connection từ khi user authenticate
  - Mount 1 lần trong `MainLayout`, tự disconnect khi logout
  - Subscribe `/user/queue/notifications`
  - Khi nhận message: dispatch `pushRealtimeNotification` + `invalidateTags(["UnreadCount"])` + `triggerBellAnimation` + show `toast()`
  - Auto reconnect mỗi 5s nếu mất kết nối
- ✅ **NotificationItem** component:
  - Icon màu per-type: `CheckSquare` (blue), `Users` (green), `UserCheck` (green), `UserPlus` (cyan), `UserMinus` (red), `ShieldCheck` (amber/purple), `FolderPlus` (cyan), `MessageSquare` (amber)
  - Unread dot (blue) góc trái + background `primary/5` khi chưa đọc
  - Text bold khi unread, muted khi đã đọc
  - Time ago (`date-fns formatDistanceToNow`)
  - Delete button xuất hiện khi hover (group hover)
- ✅ **NotificationDropdown** component:
  - Bell icon trong header với badge đỏ (số unread, tối đa "99+")
  - Bell shake animation (`bell-shake` CSS class) khi nhận notification mới
  - Dropdown panel `w-80 sm:w-96`, tối đa `max-h-[420px]` scroll
  - Header panel: "Mark all read" button (chỉ hiện khi có unread)
  - Infinite scroll với `IntersectionObserver` — cursor-based load more
  - Merge realtime items (từ Redux) + REST items (từ API), dedup theo id
  - Click item: mark as read (optimistic) + navigate to context + close dropdown
  - Empty state với Bell icon + "All caught up!"
  - Close on outside click
- ✅ **notificationUtils.ts**:
  - `getNotificationText(notification)` — trả `{title, description}` theo type. Đọc `payload.referenceName` (generic), `payload.sender` (actor), `payload.newRole`, etc.
  - `getNotificationTarget(notification)` — trả route string để navigate. `WORKSPACE_INVITE` dẫn đến `/workspaces/invitation?token=<token>` (từ payload)
- ✅ **MainLayout** cập nhật:
  - Mount `useNotificationSocket()` để khởi động WS connection
  - Thêm `<NotificationDropdown />` vào header (bên trái Profile button)
  - Dispatch `clearNotifications()` khi logout
- ✅ **index.css**: thêm `@keyframes bell-shake` + `.bell-shake` class
- ✅ **store.ts**: đăng ký `notificationReducer` + `notificationApi`

### Sprint 9 - Task CRUD & Permission System ✅ COMPLETED (Backend)

- ✅ **Task Entity** — `TaskEntity` với các fields: `title`, `description`, `priority`, `status` (default `TODO`), `startDate`, `dueDate`, `completedAt`, `position`, `createdBy`, `assignees` (ManyToMany), `parentTask` (self-reference), `deletedAt` (soft delete)
- ✅ **Task Enums**: `TaskStatus` (`TODO`, `IN_PROGRESS`, `DONE`, `OVERDUE`, `BLOCKED`, `CANCELLED`), `TaskPriority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- ✅ **Task API** — 8 endpoints (xem Backend API section)
- ✅ **Permission model** theo `ProjectMemberRole`:

  | Action                              | MANAGER   | MEMBER                            | VIEWER |
  | ----------------------------------- | --------- | --------------------------------- | ------ |
  | Đọc task (get/list/search/subtasks) | ✅        | ✅                                | ✅     |
  | Tạo task                            | ✅        | ✅                                | ❌     |
  | Update task (full)                  | ✅ bất kỳ | ✅ chỉ task mình tạo              | ❌     |
  | Update status                       | ✅ bất kỳ | ✅ task mình tạo hoặc được assign | ❌     |
  | Xóa task                            | ✅ bất kỳ | ✅ chỉ task mình tạo              | ❌     |

- ✅ **`updateTaskStatus`** tách thành endpoint riêng `PATCH /:taskId/status` để xử lý permission assignee độc lập với `updateTask`
- ✅ **Subtask support** — `parentTask` self-reference với validation chống circular dependency + max depth 5
- ✅ **Cursor-based search** — filter theo `status`, `keyword`, cursor pagination

### Sprint 9 - Task CRUD Frontend ✅ COMPLETED

- ✅ **Types** — thêm vào `types/api.ts`:
  - `TaskStatus`, `TaskPriority`, `TaskResponse`, `CreateTaskRequest`, `UpdateTaskRequest`
  - `UpdateTaskStatusRequest` — `{status: TaskStatus}` (dùng cho endpoint `PATCH /:taskId/status`)
  - `TaskSearchParams` — server-side search params: `status`, `priority`, `assigneeId`, `keyword`, `dueDateFrom`, `dueDateTo`, `page`, `size`
- ✅ **taskApi** (`features/task/api/taskApi.ts`) — RTK Query với 8 endpoints:
  - `getTasksByProject(projectId)` — tag `Task:PROJECT_{id}`
  - `searchTasks({projectId, ...params})` — server-side search với full filters
  - `getTaskById({projectId, taskId})` — tag `Task:{id}`
  - `getSubTasks({projectId, taskId})` — tag `Task:SUBTASKS_{id}`
  - `createTask({projectId, ...body})` — invalidate project + parent subtasks tag
  - `updateTask({projectId, taskId, ...body})` — full update (title, desc, priority, dates, assignees)
  - `updateTaskStatus({projectId, taskId, status})` — `PATCH /:taskId/status` (chỉ đổi status, permission rộng hơn updateTask)
  - `deleteTask({projectId, taskId})` — soft delete
- ✅ **TaskBoardPage** (`features/task/pages/TaskBoardPage.tsx`):
  - 2 view modes: **Board** (Kanban 4 cột) + **List** (grouped by status, collapsible)
  - Drag-and-drop (`@dnd-kit/core`): kéo task giữa các cột → gọi `updateTaskStatus`
  - **Server-side search**: dùng `useSearchTasksQuery` (không phải `getTasksByProject`) với `size: 200`
  - **Filter bar**: keyword (debounced 400ms) + status Select
  - **Advanced filter panel** (collapsible): priority, assignee (từ project members), dueDateFrom, dueDateTo
  - Badge count trên "Filters" button khi có advanced filter active
  - Spinner nhỏ trong search box khi `isFetching`
  - "Clear" button xuất hiện khi có bất kỳ filter nào active
  - CRUD: New Task sheet, Edit sheet, Delete dialog
- ✅ **TaskDetailPage** (`features/task/pages/TaskDetailPage.tsx`):
  - 2-column layout: Left (title + description + subtasks) + Right sidebar (status, priority, dates, assignees, meta)
  - Inline editing: click-to-edit title, description, dates
  - Status dropdown → gọi `updateTaskStatus` (không phải `updateTask`)
  - Priority dropdown → gọi `updateTask`
  - Assignee management: add/remove từ project members list
  - Subtask section: progress bar, checkbox toggle (gọi `updateTaskStatus`), quick-add input, full-form sheet
  - Breadcrumb hỗ trợ parent task navigation
- ✅ **TaskFormSheet** (`features/task/components/TaskFormSheet.tsx`):
  - Sheet tạo/sửa task (RHF + Zod)
  - Hỗ trợ cả create + edit mode (pre-fill khi có `task` prop)
  - Hỗ trợ `parentTaskId` cho subtask creation
- ✅ **Endpoint separation (quan trọng)**:
  - `updateTask` (`PUT /:taskId`) — dùng cho edit đầy đủ (title, desc, priority, dates, assignees)
  - `updateTaskStatus` (`PATCH /:taskId/status`) — dùng khi chỉ đổi status (drag-and-drop, status dropdown, subtask toggle)
  - Lý do tách: permission khác nhau — `updateTaskStatus` cho phép assignee đổi status, `updateTask` chỉ cho creator/manager
- ✅ Cập nhật **store.ts**: đã đăng ký `taskApi` reducer + middleware

### Sprint 10 - Comment System ✅ COMPLETED

> Comment section gắn cố định bên dưới nội dung task trong `TaskDetailPage`. 1-level reply (không nest thêm), emoji reactions (1 reaction per user, click again = remove, click khác = switch), @mention, cursor pagination.

**Design decisions:**

- Vị trí: fixed section bên dưới 2-column grid của task detail
- Threading: 1 cấp reply (như GitHub/Jira) — reply không có nút Reply tiếp
- Reactions: có emoji picker + 1-per-user constraint
- Input: plain textarea + @mention bằng regex `/@(\w*)$/`
- Pagination: "Load more" button (cursor-based)
- Permissions: owner có thể edit + delete; MANAGER chỉ delete; VIEWER chỉ xem

- ✅ **Types** — thêm vào `types/api.ts`:
  - `CommentResponse` — `id, taskId, parentCommentId, content, isEdited, createdAt, updatedAt, user (UserSummaryResponse), mentions (UserSummaryResponse[]), reactions (Record<string, number>)`
  - `CommentCreateRequest` — `{taskId, parentCommentId?, content, mentionUserIds?}`
  - `CommentUpdateRequest` — `{content, mentionUserIds?}`
  - `CommentReactionRequest` — `{icon}`
  - `NotificationType` mở rộng: thêm `"COMMENT_REACTION"` (ai đó react vào comment của mình) và `"COMMENT_TASK"` (ai đó comment vào task mình liên quan)
- ✅ **commentApi** (`features/task/api/commentApi.ts`) — RTK Query với 8 endpoints:
  - `getComments(taskId, cursor?, limit?)` — cursor-based, tag `Comment:TASK_{taskId}`
  - `createComment(body)` — `POST /comments`, invalidate `Comment:TASK_{taskId}`
  - `updateComment({commentId, content})` — `PUT /comments/:commentId`, invalidate task comments
  - `deleteComment(commentId)` — `DELETE /comments/:commentId`, invalidate task comments
  - `addReaction({commentId, icon})` — `POST /comments/:commentId/reactions`
  - `removeReaction({commentId, icon})` — `DELETE /comments/:commentId/reactions`
  - `updateReaction({commentId, icon})` — `PATCH /comments/:commentId/reactions` (upsert/switch — 1 request)
  - `getReactionUsers({commentId, icon})` — `GET /comments/:commentId/reactions/:icon` → `UserSummaryResponse[]`
- ✅ **CommentInput** (`features/task/components/CommentInput.tsx`):
  - Auto-resize textarea
  - `/@(\w*)$/` regex before cursor → show dropdown của project members @ filtered
  - `onMouseDown + preventDefault` trên dropdown items để tránh textarea blur
  - `Ctrl+Enter` = submit, `Escape` = cancel
  - "Replying to @name" banner khi `parentCommentId` được truyền vào
  - `extractMentionIds(text, members)` — parse `@tag` tokens, map thành user IDs; gửi kèm `mentionUserIds` trong create request
  - Props: `taskId`, `parentCommentId?`, `members: ProjectMember[]`, `onSuccess?`, `onCancel?`, `replyingToName?`, `autoFocus?`
- ✅ **CommentItem** (`features/task/components/CommentItem.tsx`):
  - `localReactions: Record<string, number>` state — mirror của `comment.reactions`, update optimistic trước API call, rollback on error
  - `myCurrentReaction: string | null` — 1-per-user constraint (thay Set<string> cũ)
  - `handleToggleReaction` — 3 cases: (1) same icon → DELETE remove; (2) no prior → POST add; (3) different icon → PATCH switch (atomic, 1 request)
  - `ReactionButton`: hover fires `useLazyGetReactionUsersQuery` → tooltip hiển thị avatars + names (max 8 + "+N others")
  - `ReactionBar`: emoji picker (EmojiPicker icon hiển thị active reaction icon khi có), highlights active emoji trong picker
  - Inline edit: `Ctrl+Enter` save, `Escape` cancel; chỉ owner (`canEdit = isOwner`); gửi `mentionUserIds` khi lưu
  - Inline delete confirm (không modal); `canDelete = isOwner || isManager`
  - Reply trigger: `isReply=true` ẩn nút Reply (chặn nest thêm)
  - **Notification deep-link highlight**: prop `highlightedCommentId?: number | null` — khi match, thêm `ring-2 ring-primary` + `scrollIntoView({ behavior: "smooth" })`; prop truyền xuống replies; `showReplies` tự expand khi reply nào là target
- ✅ **CommentSection** (`features/task/components/CommentSection.tsx`):
  - `useLazyGetCommentsQuery` — `loadInitial()` on mount và sau mutations; `loadMore()` append
  - Group: `topLevel` + `repliesMap: Record<number, CommentResponse[]>`
  - **Notification deep-link**: đọc `?commentId=` từ URL (`useSearchParams`) → tự động load thêm trang cho đến khi tìm thấy comment → set `highlightedCommentId`
  - Highlight tự xóa khi user click bất kỳ đâu (`document` click listener, `once: true`, defer 400ms để tránh clear ngay khi navigate)
  - Render: `CommentInput` ở top, list `CommentItem` (truyền `highlightedCommentId`), "Load more" button, empty state
  - Props: `taskId: number`, `projectId: number`
- ✅ **TaskDetailPage** — thêm `<CommentSection taskId={taskId} projectId={projectId} />` sau 2-column grid
- ✅ Cập nhật **store.ts**: đăng ký `commentApi` reducer + middleware

### Sprint 11 - Sprint Planning & Task Board Focus ✅ COMPLETED

- ✅ **Sprint optional model**: task vẫn hoạt động đầy đủ khi không gán sprint (`No Sprint` mode)
- ✅ **Types/API FE**:
  - Thêm `SprintStatus`, `SprintResponse`, `CreateSprintRequest`, `UpdateSprintRequest` trong `types/api.ts`
  - Tạo `sprintApi` (`features/sprint/api/sprintApi.ts`) với 4 endpoints: `getProjectSprints`, `createSprint`, `updateSprint`, `deleteSprint`
  - Đăng ký `sprintApi` vào `store.ts`
- ✅ **ProjectDetailPage**:
  - Thêm tab **Sprints** (nâng từ 4 lên 5 tabs)
  - Gắn `SprintManagementTab`
- ✅ **SprintManagementTab**:
  - CRUD Sprint (manager)
  - Card compact + progress bar + timeline badge (`Starts in / Remaining / Overdue`)
  - Sort mode: `End date (soonest)` và `Overdue first`
  - Click Sprint card → deep-link sang Task Board theo sprint (`?sprint=<id>`)
- ✅ **TaskFormSheet**:
  - Thêm Sprint select (`No Sprint` + danh sách sprint)
  - Hỗ trợ gỡ sprint khi edit task (qua `removeSprint`)
- ✅ **TaskBoardPage**:
  - Sprint selector nổi bật trên filter bar (`Any Sprint / No Sprint / Sprint cụ thể`)
  - Sprint focus summary card cho sprint đang chọn
  - Quick toggle `Active Sprint Only`
  - Summary card cho `No Sprint`
  - Ghi chú xác minh sau triển khai: deep-link từ Sprint/Tag sang task page đã tồn tại, nhưng luồng filter theo query params hiện cần được rà soát lại vì chưa đồng bộ đầy đủ với trạng thái code thực tế
  - Follow-up đã được ghi tại `Documents/task-loading-sprint-tag-issues.md`

### Sprint 12 - Analytics Dashboard ✅ COMPLETED

> Analytics engine chạy hoàn toàn trên **Elasticsearch aggregations** — không tính toán trên Postgres hay frontend. Tài liệu chi tiết tại `C:\Users\ChiLua\Documents\TaskSense_Analytics.md`.

- ✅ **Backend — `AnalyticsController`**: `GET /projects/{projectId}/analytics` với `@PreAuthorize("@perm.project(#projectId, 'VIEW_TASKS')")`
- ✅ **Backend — `SearchIndexService.getProjectAnalytics()`**: 7 ES aggregations song song:
  - `status_dist` — `terms(status)` → StatusDistribution map
  - `priority_dist` — `terms(priority)` → PriorityDistribution map
  - `overdue` — `filter(dueDate < now AND status != DONE)` → overdueCount
  - `completion_trend` — `filter(completedAt >= 30d ago) → date_histogram/day` → completionTrend
  - `member_total/done/overdue` — `filter → nested(assignees) → terms(assignees.id)` → memberPerformance
  - `sprint_velocity` — `filter(DONE + sprintId exists) → terms(sprintId)` → sprintVelocity
- ✅ **Backend — Derived metrics** (tính trong Java sau khi parse aggregation):
  - `healthScore = round(completionRate×0.6 + onTimeRate×0.4)` (0–100)
  - `avgDailyVelocity = sum(completionTrend) / 30`
  - `projectedCompletionDate = today + ceil(remaining / avgDailyVelocity)` (null nếu velocity = 0)
  - `memberPerformanceScore = round((completionRate×0.6 + onTimeRate×0.4)×100)`
- ✅ **`ProjectAnalyticsResponse`** DTO: `totalTasks`, `statusDistribution`, `priorityDistribution`, `overdueCount`, `completionTrend`, `healthScore`, `projectedCompletionDate`, `avgDailyVelocity`, `sprintVelocity`, `memberPerformance`
- ✅ **Types** — thêm vào `types/api.ts`:
  - `DayCount` — `{date: string; count: number}`
  - `SprintVelocity` — `{sprintId: number; completedCount: number}`
  - `MemberPerformance` — `{userId, assignedCount, completedCount, overdueCount, performanceScore}`
  - `ProjectAnalyticsResponse` — tổng hợp tất cả analytics fields
- ✅ **`analyticsApi`** (`features/analytics/api/analyticsApi.ts`) — RTK Query, 1 endpoint: `getProjectAnalytics(projectId)` → `GET /projects/${projectId}/analytics`
- ✅ **`ProjectAnalyticsTab`** (`features/analytics/components/ProjectAnalyticsTab.tsx`) — 6 sections:
  1. **Summary stats**: 4 stat cards — Total Tasks, Completed %, Overdue count, Velocity (30d)
  2. **Project Health + Projected Completion**: health score badge (Healthy/At Risk/Critical) + ngày dự kiến xong
  3. **Status Distribution**: DistBar progress bars + BarChart (recharts)
  4. **Priority Distribution**: DistBar progress bars + BarChart
  5. **Completion Trend (30 days)**: LineChart ngày × count (recharts)
  6. **Sprint Velocity**: BarChart tasks completed per sprint (enrich với sprint name)
  7. **Member Performance** (chỉ `showMemberWorkload=true` — MANAGER): avatar + name + score badge + progress bar + assigned/done/overdue stats
- ✅ **`ProjectDetailPage`** — thêm tab **Analytics** (nâng từ 5 lên 6 tabs):
  - `TabsTrigger value="analytics"` với `BarChart2` icon
  - `<ProjectAnalyticsTab projectId={projectId} showMemberWorkload={canManageMembers} members={allMembers} sprints={sprints} />`
- ✅ Cài thêm dependency: **`recharts`** (`npm install recharts`)
- ✅ Cập nhật **store.ts**: đăng ký `analyticsApi` reducer + middleware
- ✅ **Phân quyền**: MANAGER thấy Member Performance; MEMBER/VIEWER thấy tất cả phần còn lại

### Sprint 13 - Leave Project / Leave Workspace ✅ COMPLETED

> Users can voluntarily leave a project or workspace. Soft-delete with cascade, last-owner/manager guard, and admin notifications.

**Backend**:
- ✅ `NotificationType` enum — added `WORKSPACE_LEAVE`, `PROJECT_LEAVE`
- ✅ `ProjectMemberRepository` — added `countByProjectIdAndRole`, `findAllByProjectIdAndRole` (Spring Data derived queries)
- ✅ `WorkspaceMemberRepository` — added `findByWorkspaceIdAndRoleIn`
- ✅ `ProjectMemberService` + impl — `leaveProject(projectId)`: guard last MANAGER (ConflictException 409), soft-delete, evict permission cache, notify remaining MANAGERs with `PROJECT_LEAVE`
- ✅ `WorkspaceMemberService` + impl — `leaveWorkspace(workspaceId)`: guard last OWNER (ConflictException 409), soft-delete + cascade all project memberships (`softDeleteByWorkspaceIdAndUserId`), evict cache, notify all OWNERs+MANAGERs with `WORKSPACE_LEAVE`
- ✅ `WorkspaceController` — `DELETE /{workspaceId}/leave` → full path `DELETE /workspaces/{workspaceId}/leave` (placed here to avoid `@PathVariable Long` type-mismatch in `WorkspaceMemberController`)
- ✅ `ProjectController` — `DELETE /{projectId}/leave` → full path `DELETE /workspaces/{workspaceId}/projects/{projectId}/leave` (same reason — avoids `/{userId}` conflict in `ProjectMemberController`)

**Frontend API**:
- ✅ `workspaceMemberApi` — added `leaveWorkspace` mutation: `DELETE /workspaces/:workspaceId/leave`, invalidates `WorkspaceMember:{workspaceId}`; exports `useLeaveWorkspaceMutation`
- ✅ `projectMemberApi` — added `leaveProject` mutation: `DELETE /workspaces/:workspaceId/projects/:projectId/leave`, invalidates `ProjectMember:{projectId}`; exports `useLeaveProjectMutation`

**Frontend UI**:
- ✅ `WorkspaceMembersTab` — "Leave Workspace" button (outline/destructive) in header → confirmation Dialog with `AlertTriangle` warning → on success navigate to `/workspaces`
- ✅ `ProjectDetailPage` — "Leave Project" button in Members tab header (visible when `currentUserMember` truthy) → confirmation Dialog → on success navigate to `/workspaces/${workspaceId}`
- ✅ `notificationUtils.ts` — added `WORKSPACE_LEAVE` and `PROJECT_LEAVE` cases in `getNotificationText()` and `getNotificationTarget()`
- ✅ `NotificationItem` — added `LogOut` icon (red-500) for both leave types
- ✅ `types/api.ts` — extended `NotificationType` with `"WORKSPACE_LEAVE"` and `"PROJECT_LEAVE"`

**Business rules**:
- Last workspace OWNER → 409 ConflictException (must transfer ownership first)
- Last project MANAGER → 409 ConflictException (must transfer role first)
- Non-member calls leave → 404 ResourceNotFoundException
- Workspace leave cascades: soft-deletes all project memberships in that workspace

### Sprint 7 - Project CRUD & Member Management ✅ COMPLETED

- ✅ **Types** — thêm vào `types/api.ts`:
  - `ProjectStatus` type: `'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD'`
  - `ProjectMemberRole` type: `'MANAGER' | 'MEMBER' | 'VIEWER'`
  - `ProjectMemberAddStatus` type: `'CREATED' | 'RESTORED' | 'ALREADY_EXISTS' | 'NOT_FOUND'`
  - `JoinRequestStatus` type: `'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'`
  - `Project` — `id, workspaceId, name, description, status, startDate, endDate, createdAt, updatedAt`
  - `CreateProjectRequest`, `UpdateProjectRequest`
  - `ProjectMember` — embed `UserSummaryResponse`, có `role`, `projectId`, `createdAt`
  - `ProjectMemberItem`, `AddProjectMemberRequest`, `AddProjectMemberResultItem`
  - `UpdateProjectMemberRoleRequest`
  - `ProjectJoinRequest` — `user, status, message, reviewedBy, reviewedAt, createdAt`
  - `SendProjectJoinRequestBody`, `ReviewProjectJoinRequestBody`
- ✅ **projectApi** — RTK Query với 6 endpoints:
  - `getProjectsByWorkspace` — tag `Project:WORKSPACE_{id}`
  - `getProjectById` — tag `Project:{id}`
  - `createProject`, `updateProject`, `deleteProject` — invalidate workspace tag
  - `getCurrentUserRole` — `GET /projects/:id/members/me/role` → `ProjectMemberRole`
- ✅ **projectMemberApi** — RTK Query 5 endpoints: `getMembers`, `addMembers`, `updateMemberRole`, `removeMember`, `leaveProject`
- ✅ **projectMemberApi** — RTK Query với 4 endpoints: `getMembers`, `addMembers`, `updateMemberRole`, `removeMember`
- ✅ **projectJoinRequestApi** — RTK Query với 4 endpoints: `sendJoinRequest`, `getJoinRequests`, `reviewJoinRequest`, `cancelJoinRequest`
- ✅ **WorkspaceDetailPage** — Projects tab thay MOCK_PROJECTS bằng real API (`useGetProjectsByWorkspaceQuery`):
  - Grid lưới `ProjectCard` + `ProjectCardGhost` (navigate → CreateProjectPage)
  - Summary: số active / completed / archived
  - Loading state với spinner
- ✅ **ProjectCard** (`features/project/components/ProjectCard.tsx`):
  - Hiển thị: name, description (line-clamp-2), status badge (color-coded), member count, due date
  - Click card → navigate `/workspaces/:id/projects/:projectId` (với `state.workspaceName`)
  - 3-dot menu (chỉ MANAGER): Edit + Delete
  - `STATUS_CONFIG` và `ROLE_LABEL` được export để dùng ở các nơi khác
- ✅ **ProjectCardGhost** — ghost card navigate đến `/workspaces/:id/projects/new`
- ✅ **CreateProjectPage** (`/workspaces/:id/projects/new`):
  - Breadcrumb: `Workspaces > [name] > New Project`
  - Form (RHF + Zod): Name (required), Description (optional), Status (select, default ACTIVE), Start Date, End Date
  - Submit → `POST /workspaces/:id/projects` → navigate sang ProjectDetailPage
- ✅ **ProjectDetailPage** (`/workspaces/:id/projects/:projectId`) — 4 tabs:
  - **Overview tab**: Project info card (status, members count, start/end date, description). Edit button cho MANAGER.
  - **Tasks tab**: Placeholder UI (dành cho sprint sau)
  - **Members tab**: Grid `MemberCard` component. "Add Members" button cho MANAGER. "Leave Project" button (outline/destructive, hiện khi `currentUserMember` truthy) → confirmation dialog → gọi `leaveProject` → navigate về `/workspaces/${workspaceId}`; block nếu là MANAGER duy nhất (409 từ backend).
  - **Join Requests tab** (chỉ MANAGER thấy): list `JoinRequestItem` với Approve/Reject actions. Badge hiện pending count.
  - Header: Project name + status badge + description + current user role. Edit/Delete button cho MANAGER.
  - Breadcrumb: `Workspaces > [workspaceName] > [projectName]`. `workspaceName` lấy từ `location.state` (truyền từ ProjectCard navigate) hoặc gọi API nếu không có.
- ✅ **EditProjectModal** — Dialog edit project (name, desc, status, startDate, endDate). pre-fill + isDirty guard.
- ✅ **DeleteProjectDialog** — type-to-confirm (gõ tên project). navigate về workspace sau khi xóa.
- ✅ **MemberCard** (`features/project/components/MemberCard.tsx`):
  - Card dọc (grid layout): avatar, name + email, role badge (crown/user/eye icon)
  - Hover → 3-dot menu (chỉ khi `canManage && !isSelf`): Change Role submenu + Remove
  - Remove → mở confirmation Dialog (khác với WorkspaceMembersTab dùng inline confirm)
- ✅ **AddMembersModal** (`features/project/components/AddMembersModal.tsx`):
  - Nguồn thêm member: **members của workspace** (không phải search toàn hệ thống)
  - Filter out những người đã là project member
  - Search/filter theo tên hoặc email trong danh sách workspace members
  - Chọn role per-user (inline Select), hoặc default role áp dụng cho tất cả
  - Batch submit → `POST /projects/:id/members` → hiển thị kết quả (CREATED / RESTORED / ALREADY_EXISTS)
- ✅ **JoinRequestItem** (inline component trong ProjectDetailPage):
  - Hiển thị: avatar, name, email, status badge, message, timestamp
  - PENDING + canReview → Approve / Reject buttons
- ✅ Cập nhật **store.ts**: thêm `projectApi`, `projectMemberApi`, `projectJoinRequestApi`
- ✅ Cập nhật **routes**: thêm `/workspaces/:id/projects/new` và `/workspaces/:id/projects/:projectId`

### Sprint 8.1 - Notification Enhancements ✅ COMPLETED

> Bổ sung hỗ trợ notification type mới và fix bug crash real-time.

- ✅ **NotificationType mở rộng** — thêm `"WORKSPACE_REVIEW_REQUEST"` vào `types/api.ts`:
  - Backend gửi type này khi OWNER/MANAGER review (approve/reject) một workspace join request
  - Text: `"Workspace join request approved"` / `"Workspace join request rejected"` (phát hiện qua `referenceId !== null` → approved)
  - Navigation: APPROVED → `/workspaces/${workspaceId}`, REJECTED → `/workspaces`
- ✅ **WORKSPACE_JOIN_REQUEST navigation** cập nhật → `/workspaces/${workspaceId}?tab=members` (dẫn trực tiếp vào tab Members để review)
- ✅ **NotificationItem**: thêm icon `ClipboardCheck` (màu green-500) cho `WORKSPACE_REVIEW_REQUEST`
- ✅ **Safe date parsing**: bọc `formatDistanceToNow` bằng IIFE với guard `isNaN(d.getTime())` → trả `"just now"` khi `createdAt` invalid (backend WebSocket DTO không luôn có field này)
- ✅ **useNotificationSocket**: thêm fallback `createdAt: message.createdAt ?? new Date().toISOString()` khi normalize WebSocket message → tránh crash ở `NotificationItem`
- ✅ **WorkspaceDetailPage**: đọc `?tab=` query param qua `useSearchParams` → set `defaultValue` cho `<Tabs>` → `/workspaces/:id?tab=members` navigate thẳng vào tab Members

### Sprint 9 - Workspace Join Request ✅ COMPLETED

- ✅ **Types** — thêm vào `types/api.ts`:
  - `WorkspaceJoinRequestStatus` type: `'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'`
  - `WorkspaceJoinRequest` — `id, workspaceId, user (UserSummaryResponse), status, message, reviewedBy, reviewedAt, createdAt, updatedAt`
  - `CreateWorkspaceJoinRequestBody` — `{message?: string}`
  - `ReviewWorkspaceJoinRequestBody` — `{status: "APPROVED" | "REJECTED"}`
- ✅ **workspaceJoinRequestApi** (`features/workspace/api/workspaceJoinRequestApi.ts`) — RTK Query với 4 endpoints:
  - `getWorkspaceJoinRequests(workspaceId)` — tag `WorkspaceJoinRequest:${workspaceId}`
  - `createJoinRequest({workspaceId, body})` — `POST /workspaces/:id/join-requests`
  - `reviewJoinRequest({requestId, workspaceId, body})` — `PATCH .../review`
  - `cancelJoinRequest({requestId, workspaceId})` — `DELETE .../join-requests/:requestId`
- ✅ **workspaceApi** — thêm 2 endpoints mới:
  - `searchWorkspaces({name, cursor?, limit?})` → `GET /workspaces/search` (tìm kiếm public workspaces)
  - `getPublicWorkspaces({userId, page?, size?, sort?})` → `GET /workspaces/public/:userId` (pageable public workspaces của user khác)
- ✅ **WorkspaceExploreCard** (`features/workspace/components/WorkspaceExploreCard.tsx`):
  - Card hiển thị public workspace: tên, Globe icon, description, created date
  - Action button logic: không có request → "Request to join"; PENDING → "Cancel request" (gọi `cancelJoinRequest`); APPROVED → Badge xanh; REJECTED → Badge đỏ
  - Quản lý `localRequest` state locally sau `onSuccess` callback từ `JoinRequestDialog`
- ✅ **JoinRequestDialog** (`features/workspace/components/JoinRequestDialog.tsx`):
  - Dialog xác nhận gửi join request với optional textarea (max 500 chars, character counter)
  - Cancel + "Send request" buttons; gọi `createJoinRequest`, on success callback `onSuccess(result.data)`
- ✅ **WorkspaceExplorePage** (`features/workspace/pages/WorkspaceExplorePage.tsx`):
  - Route `/workspaces/explore` — search-first (empty state cho đến khi nhập keyword)
  - Search input debounce 400ms (`use-debounce` package)
  - Filter out workspaces user đã là member (`myWorkspaceIds`)
  - Shows: loading spinner / "no results" / grid of `WorkspaceExploreCard`
- ✅ **WorkspaceMembersTab** — thêm section "Join Requests" (section thứ 3, dưới Pending Invitations):
  - Chỉ OWNER/MANAGER thấy phần này (skip query khi `!canManage`)
  - Clickable row để expand → hiện message (hoặc "No message provided")
  - Inline Approve (green) + Reject (destructive) buttons
  - Pending count hiển thị badge màu primary trên section header
  - Fix ordering: `canManage` được tính TRƯỚC khi gọi join requests query (tránh lỗi "used before declaration")
- ✅ **UserProfileDrawer** — thêm tab thứ 3 "Workspaces":
  - Dùng `useGetPublicWorkspacesQuery(userId)` + `useGetMyWorkspacesQuery()` để filter bỏ workspace đã join
  - Render danh sách `WorkspaceExploreCard` (user có thể gửi join request từ đây)
- ✅ **MainLayout** — thêm nav item "Explore" (`Compass` icon, `indent: true`) → `/workspaces/explore`
  - Nav item hỗ trợ `indent: true` prop → thêm `ml-3` class
  - `/workspaces` NavLink dùng `end` prop để không bị active khi đang ở `/workspaces/explore`
- ✅ **routes/index.tsx** — thêm route `/workspaces/explore` (trước `/workspaces/invitation` và `/:id`)
- ✅ **store.ts** — đăng ký `workspaceJoinRequestApi` reducer + middleware
- ✅ Cài thêm dependency: **`use-debounce`** (`npm install use-debounce`)

## 🗺️ Routes hiện tại

| Path                                                | Component                 | Ghi chú                                                                                           |
| --------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `/`                                                 | → `/dashboard`            | redirect                                                                                          |
| `/auth/login`                                       | `LoginPage`               | trong `AuthLayout`                                                                                |
| `/auth/register`                                    | `RegisterPage`            |                                                                                                   |
| `/auth/verify-otp`                                  | `VerifyOtpPage`           |                                                                                                   |
| `/auth/forgot-password`                             | `ForgotPasswordPage`      |                                                                                                   |
| `/auth/reset-password`                              | `ResetPasswordPage`       |                                                                                                   |
| `/dashboard`                                        | `DashboardPage`           | trong `MainLayout`                                                                                |
| `/dashboard/edit-profile`                           | → `/profile`              | redirect (backward compat)                                                                        |
| `/profile`                                          | `ProfilePage`             | 2 tabs: Info + Skills                                                                             |
| `/workspaces`                                       | `WorkspacesPage`          | Pinned / Recent / All                                                                             |
| `/workspaces/explore`                               | `WorkspaceExplorePage`    | Search public workspaces; **phải đứng trước `/workspaces/invitation` và `/:id`**                  |
| `/workspaces/invitation`                            | `WorkspaceInvitationPage` | **phải đứng trước `:id`**                                                                         |
| `/workspaces/:id`                                   | `WorkspaceDetailPage`     | 3 tabs: Projects / Members / Settings; hỗ trợ `?tab=` query param                                 |
| `/workspaces/:id/projects/new`                      | `CreateProjectPage`       |                                                                                                   |
| `/workspaces/:id/projects/:projectId`               | `ProjectDetailPage`       | 5 tabs: Overview / Tasks / Sprints / Members / Join Requests                                      |
| `/workspaces/:id/projects/:projectId/tasks`         | `TaskBoardPage`           | Kanban + List; hiện có deep-link target từ Sprint/Tag, nhưng filter sprint/tag cần follow-up thêm |
| `/workspaces/:id/projects/:projectId/tasks/:taskId` | `TaskDetailPage`          | Chi tiết task + inline edit + subtasks                                                            |
| `/team-templates`                                   | `TeamTemplatesPage`       |                                                                                                   |
| `/team-templates/:id`                               | `TeamTemplateDetailPage`  | 2 tabs: Members + Settings                                                                        |
| `/tasks`                                            | `PlaceholderPage`         | mock                                                                                              |
| `/calendar`                                         | `PlaceholderPage`         | mock                                                                                              |
| `/analytics`                                        | `PlaceholderPage`         | mock                                                                                              |
| `/settings`                                         | `PlaceholderPage`         | mock                                                                                              |
| `*`                                                 | → `/auth/login`           | catch-all                                                                                         |

## 📝 Quyết định thiết kế hiện tại

1. **Ưu tiên trang chủ sau login**: tập trung task board, không hiển thị profile trực tiếp trong dashboard body.
2. **Profile access**: mở bằng **drawer bên phải** từ avatar/header.
3. **Sidebar**: hiển thị icon + label — Dashboard, Workspaces, Team Templates, My Tasks, Calendar, Analytics, Profile, Settings.
4. **Profile page** (`/profile`):
   - 2 tabs: **Info** và **Skills**
   - Route cũ `/dashboard/edit-profile` redirect sang `/profile` để backward compat
   - Sidebar "Profile" trỏ thẳng vào `/profile`
5. **Profile fields** (tab Info):
   - Read-only: `email`
   - Editable: `fullName`, `phone`, `gender`, `dob`, `bio`
6. **Profile data hiện tại**: dùng mock data trong `userSlice` đến khi backend sẵn sàng.
7. **Skills design**:
   - **Level display**: ★ star rating (1–5 sao màu amber). Kèm label text bên phải (Beginner / Elementary / Intermediate / Advanced / Expert).
   - **Add UX**: nút "Add Skill" → hiện inline form ở cuối list (Input + star picker + Save/Cancel).
   - **Edit UX**: hover row → icon ✏️ → expand inline edit row tại chỗ (không mở modal).
   - **Delete UX**: hover row → icon 🗑️ → xóa ngay với loading spinner, toast confirm.
   - **View-only mode**: `SkillsSection` nhận prop `userId` → dùng `GET /users/{id}/skills`, ẩn toàn bộ action buttons.
8. **Workspace layout** (`/workspaces`):
   - **Pinned section**: user tự pin thủ công bằng nút ⭐ trên card. State lưu trong `localStorage` qua `workspaceSlice`.
   - **Recent section**: tự động track 5 workspace được mở gần nhất. Cũng lưu `localStorage`.
   - **Ghost card**: luôn hiện ở cuối grid "All workspaces" để tạo nhanh.
   - Khi xóa workspace: dispatch `removeFromPinnedAndRecent(id)` để dọn state local.
9. **Workspace Detail** (`/workspaces/:id`):
   - Breadcrumb: `Workspaces > [name]`.
   - 3 tabs: Projects / Members / Settings.
   - **Projects tab**: dùng real API (`useGetProjectsByWorkspaceQuery`). Ghost card → `/workspaces/:id/projects/new`.
   - **Settings tab**: form chỉnh sửa inline. Nút Save chỉ enable khi `isDirty`. Danger Zone có nút Delete mở `DeleteWorkspaceDialog`.
   - **`?tab=` query param**: `WorkspaceDetailPage` đọc `searchParams.get("tab")` làm `defaultValue` cho `<Tabs>`. Cho phép navigate trực tiếp vào tab cụ thể, ví dụ từ notification link `/workspaces/:id?tab=members`.
   - Khi delete thành công từ detail page: navigate về `/workspaces`.
10. **Delete workflow (workspace/project)**: Bắt buộc gõ lại đúng tên (paste bị chặn bằng `onPaste preventDefault`). Nút delete disabled cho đến khi text khớp.
11. **Project Detail** (`/workspaces/:id/projects/:projectId`):
    - Breadcrumb: `Workspaces > [workspaceName] > [projectName]`. `workspaceName` truyền qua `location.state` từ card click hoặc fetch fallback.

- 5 tabs: Overview / Tasks / Sprints / Members / Join Requests.
- **Sprints tab**: sprint optional, manager có thể CRUD, card compact có timeline + deep-link vào Task Board theo sprint.
  - **Join Requests tab**: chỉ hiện cho MANAGER. Badge đếm pending.
  - Role detection: gọi `GET /projects/:id/members/me/role` riêng (không embed trong project response).

12. **AddMembersModal (Project)** khác với **BulkInviteModal (Workspace)**:
    - Project: source là workspace members (không search toàn hệ thống), batch add với role per-member.
    - Workspace: source là search hệ thống + direct email + template import, send invite qua email.
13. **Task permission model**:
    - `updateTask` (full edit) chỉ dành cho MANAGER hoặc người tạo task (MEMBER).
    - `updateTaskStatus` là endpoint riêng (`PATCH /:taskId/status`) — cho phép assignee update status mà không cần quyền edit toàn bộ task.
    - VIEWER không được thực hiện bất kỳ thao tác ghi nào trên task.
    - Frontend cần gọi đúng endpoint tùy theo action: dùng `PUT /:taskId` cho edit đầy đủ, `PATCH /:taskId/status` khi chỉ đổi status.

## 🔧 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=<to-be-configured>
```

## 🛠️ Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## 📌 Ghi chú cho AI/Developer tiếp theo

- Đọc `DESIGN_SYSTEM.md` trước khi tạo component mới.
- Ưu tiên dùng shadcn/ui + Tailwind token, tránh hardcode style.
- API call đi qua RTK Query.

### Avatar Upload Architecture

- `useAvatarUpload()` hook xử lý:
  - `validateAndPreview(file)` - validate file và create preview (async)
  - `uploadAvatarToS3()` - upload file lên S3, return `fileUrl` (không update profile)
  - `clearPreview()` - xóa preview và reset state
- `AvatarUpload` component là UI chỉ cho preview + choose/cancel
  - Không có upload button riêng
  - Dựa vào form's "Save Changes" button
- Workflow ở `EditProfilePage`:
  - Form submit → check `selectedFile` từ hook
  - Nếu có: gọi `uploadAvatarToS3()` → lấy `fileUrl`
  - Thêm `avatarUrl: fileUrl` vào payload
  - Gọi `updateUserProfile(payload)` một lần duy nhất
- S3 upload là direct PUT request với presigned URL
- Atomic update: PUT /users/me gồm full profile + avatar URL
- State: `selectedFile` lưu File object, `previewUrl` lưu object URL để display

### User Skill Architecture

- **`userSkillApi`** (RTK Query): tag `'UserSkill'` — tất cả mutation đều invalidate tag này.
- **`SkillStars`** component:
  - Props: `value` (1-5), `onChange?` (clickable nếu có), `size` (`sm` | `default`), `showLabel` (hiện text Beginner→Expert)
  - Dùng `fill-amber-400` cho sao được chọn, `text-muted-foreground/30` cho sao chưa chọn
  - Import từ `@/features/user/components/SkillStars`
- **`SkillsSection`** component:
  - Prop `userId?: number` — nếu không truyền → own profile (full CRUD); nếu truyền → view-only cho user khác
  - Dùng RTK Query `skip` pattern để chỉ gọi endpoint phù hợp
  - Local state: `editingId`, `showAddForm` để quản lý inline forms
- **`ProfilePage`** (`/profile`):
  - Tab "Info" là `ProfileInfoTab` component (nội dung giống EditProfilePage cũ)
  - Tab "Skills" là `SkillsSection` component
  - **`EditProfilePage`** vẫn giữ trong codebase nhưng không còn dùng trực tiếp; `/dashboard/edit-profile` redirect về `/profile`
- **Level label mapping**: `{ 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Advanced', 5: 'Expert' }` — constant `LEVEL_LABELS` export từ `SkillStars.tsx`
- ~~**Việc cần làm khi muốn hiển thị skill của user khác**~~ ✅ **Đã hoàn thành**: xem `UserProfileDrawer` bên dưới.

### UserProfileDrawer Architecture

- **`UserProfileDrawer`** (`features/user/components/UserProfileDrawer.tsx`):
  - Props: `userId: number | null | undefined`, `open: boolean`, `onClose: () => void`
  - Gọi `useGetUserByIdQuery(userId, { skip: !userId })` — lazy, chỉ fetch khi drawer mở
  - `getUserById` trả `ApiResponse<User>` (đầy đủ: fullName, email, phone, gender, dob, bio, avatarUrl)
  - 2 tabs: **Info** (bio + InfoRow grid) + **Skills** (`<SkillsSection userId={userId} />` — view-only)
  - Loading state trong avatar circle; error state toàn body
- **Trigger pattern** (nhất quán ở cả 2 nơi):
  - `MembersTab` (TeamTemplateDetailPage): click vào `<button>` bao quanh avatar + tên → `openProfile(userId)`
  - `AddMembersModal`: mỗi row tìm kiếm có 2 zone — left `<button>` (tên/avatar → xem profile) + right nút `+` (thêm vào selection)
- **Portal stacking**: `SheetContent` render qua React Portal, hiển thị đúng khi Sheet mở từ bên trong Dialog
- **Visual cues**: hover tên → `hover:text-primary hover:underline`; hover avatar → `hover:ring-2 hover:ring-primary/40`

### Workspace Member & Invite Architecture

- **`workspaceMemberApi`** (RTK Query): tag `'WorkspaceMember'` keyed by `workspaceId`. Endpoints: `getWorkspaceMembers`, `updateMemberRole`, `removeMember`.
- **`workspaceInviteApi`** (RTK Query): tag `'WorkspaceInvite'` keyed by `workspaceId`. Endpoints: `getWorkspaceInvites`, `inviteMember`, `acceptInvite`, `revokeInvite`, `bulkInviteMembers`.
- **Permission detection**: `WorkspaceMembersTab` tìm member có `user.id === currentUserId` trong danh sách để xác định `myRole`. OWNER > MANAGER > MEMBER/VIEWER.
- **Invite flow**: Backend gửi email với link `{frontendUrl}/workspaces/invitation?token=rawToken`. FE call `POST /workspaces/invites/accept` với raw token.
- **`WorkspaceInvitationPage`**: Route `/workspaces/invitation` phải đứng TRƯỚC `/workspaces/:id` trong routes để tránh routing conflict.
- **Role badge styling**: Mỗi role có màu riêng — OWNER: amber, MANAGER: blue, MEMBER/VIEWER: muted.
- **UserProfileDrawer reuse**: Click avatar/tên member → `setProfileUserId(id)` → mở drawer (pattern nhất quán với TeamTemplate).
- **`BulkInviteModal`**: 2-cột dialog. Cột trái add people (search registered + direct email + team template picker); cột phải invite list (role per-person + default role). Dedup theo email (case-insensitive). Submit gọi `POST /workspaces/:id/invites/bulk`.
- **Default role behavior**: Thay đổi default role → chỉ update rows đang có role bằng giá trị default cũ (không overwrite những row đã được chỉnh thủ công).
- **Template deduplication**: Member đã có trong invite list → hiện `Added` label + disabled checkbox trong template picker; kiểm tra theo email case-insensitive.
- **`BulkInviteResult` handling**: Backend trả `{success[], failed[]}` — FE hiển result view sau submit, list success (green) và failed (red + reason).

### Workspace Architecture

- **`workspaceApi`** (RTK Query): tag `'Workspace'` — tất cả mutation đều invalidate tag này. Thêm 2 endpoints: `searchWorkspaces` (public search) + `getPublicWorkspaces(userId)` (profile view).
- **`workspaceSlice`**: chỉ lưu state local (`pinnedIds`, `recentIds`), không cache workspace data. Workspace data đến từ RTK Query cache.
- **`WorkspaceCard`** nhận `onEdit` / `onDelete` callback → page-level state quản lý modal target (`editTarget`, `deleteTarget`). Pattern này dùng chung cho cả `WorkspacesPage` và `WorkspaceDetailPage`.
- **Projects tab** trong `WorkspaceDetailPage` dùng `useGetProjectsByWorkspaceQuery` (real API). Ghost card `ProjectCardGhost` navigate đến `/workspaces/:id/projects/new`.
- **Routing patterns**: `/workspaces` và `/workspaces/:id` đều nằm trong `MainLayout` (authenticated).

### Workspace Join Request Architecture (Sprint 9)

- **`workspaceJoinRequestApi`** (RTK Query): tag `'WorkspaceJoinRequest'` keyed by `workspaceId`. 4 endpoints: `getWorkspaceJoinRequests`, `createJoinRequest`, `reviewJoinRequest`, `cancelJoinRequest`.
- **`WorkspaceExploreCard`** quản lý `localRequest` state: sau khi dialog `onSuccess(newRequest)` trả về, card cập nhật UI ngay (không refetch). Cancel request → `cancelJoinRequest` → `localRequest = null`.
- **`JoinRequestDialog`** là confirm dialog thuần (không navigate), chỉ call API + trả data qua `onSuccess` callback.
- **`WorkspaceExplorePage`** logic:
  - Không hiển thị gì khi search input rỗng (search-first pattern).
  - `debouncedQuery` 400ms trước khi trigger RTK Query.
  - Filter `myWorkspaceIds` từ `useGetMyWorkspacesQuery` để ẩn workspace đã join.
  - Skip query khi `!debouncedQuery` để tránh gọi API không cần thiết.
- **`WorkspaceMembersTab` Join Requests section**: `canManage` phải được tính TRƯỚC khi dùng trong `skip: !canManage` của RTK Query hook. Thứ tự đúng: tính `members → myMember → myRole → canManage`, rồi mới gọi `useGetWorkspaceJoinRequestsQuery`.
- **`use-debounce` dependency**: đã cài (`npm install use-debounce`). Dùng `useDebounce(value, 400)` pattern trong search inputs.
- **Route ordering** trong `routes/index.tsx`: `/workspaces/explore` phải đứng TRƯỚC `/workspaces/invitation` và `/workspaces/:id`.
- **`UserProfileDrawer` Workspaces tab**: filter bỏ workspaces user đã là member của profile đang xem bằng cách so sánh `myWorkspaceIds` (từ current user) với `publicWorkspaces` (của target user).

### Project Architecture

- **`projectApi`** (RTK Query): tag `'Project'` keyed by `projectId` hoặc `WORKSPACE_{workspaceId}`. Endpoints: `getProjectsByWorkspace`, `getProjectById`, `createProject`, `updateProject`, `deleteProject`, `getCurrentUserRole`.
- **`projectMemberApi`** (RTK Query): tag `'ProjectMember'` keyed by `projectId`. Endpoints: `getMembers`, `addMembers`, `updateMemberRole`, `removeMember`.
- **`projectJoinRequestApi`** (RTK Query): tag `'ProjectJoinRequest'` keyed by `projectId`. Endpoints: `sendJoinRequest`, `getJoinRequests`, `reviewJoinRequest`, `cancelJoinRequest`.
- **Role detection**: `ProjectDetailPage` gọi `useGetCurrentUserRoleQuery(projectId)` riêng để xác định `isManager`. Kết quả `MANAGER` mới thấy các action buttons và Join Requests tab.
- **`STATUS_CONFIG`** export từ `ProjectCard.tsx`: mapping `ProjectStatus` → `{label, icon, badgeClass}`. Import trực tiếp ở `CreateProjectPage`, `EditProjectModal`, `ProjectDetailPage`.
- **`ROLE_LABEL`** export từ `ProjectCard.tsx`: mapping `ProjectMemberRole` → display string.
- **`AddMembersModal` (project)**: lấy source từ `useGetWorkspaceMembersQuery(workspaceId)`, filter bỏ những ai đã là project member. Chỉ thêm workspace members, không search toàn hệ thống.
- **`MemberCard`**: card dọc (khác với WorkspaceMembersTab dùng row ngang). Remove action mở Dialog trong chính card (inline), không bubble lên parent.
- **`workspaceName` breadcrumb pattern**: `ProjectCard` navigate với `state: { workspaceName }`. `ProjectDetailPage` đọc từ `location.state` trước, fallback sang gọi `useGetWorkspaceByIdQuery` nếu state không có.

### Notification Architecture

- **Connection lifecycle**: `useNotificationSocket()` mount trong `MainLayout` — kết nối ngay khi user vào `MainLayout`, disconnect khi logout (cleanup trong `clearNotifications`). Luôn có duy nhất 1 connection trong toàn session.
- **WebSocket routing**: Spring Security `convertAndSendToUser` dùng `principal.getName()` = `JWT sub` = **email**. Do đó BE **phải** route bằng `receiverEmail` (không phải numeric id).
- **unreadCount flow**: Fetch 1 lần lúc mount (`useGetUnreadCountQuery`, không polling) → sync vào Redux `setUnreadCount`. Mỗi socket push: Redux `unreadCount += 1` + `invalidateTags(["UnreadCount"])` để refetch từ server.
- **Bell animation**: Toggle CSS class `.bell-shake` (không dùng Tailwind arbitrary `animate-[...]` vì Tailwind v4 không nhận `@keyframes` từ global CSS qua class). Flag `bellAnimating` trong Redux, auto-clear sau 1s qua `setTimeout`.
- **Pagination**: cursor-based — `GET /notifications?cursor=<lastId>&limit=10`. `IntersectionObserver` trên sentinel div ở cuối list trigger load thêm.
- **Item merge**: `realtimeItems` (Redux, mới nhất trước) ghép với `apiItems` (REST, cursor page). Dedup theo `id` — realtime thắng nếu trùng id.
- **Payload conventions** (từ BE):
  - `payload.referenceName` — tên entity (workspace/project/task name)
  - `payload.sender` — tên người gửi invite (chỉ `WORKSPACE_INVITE`)
  - `payload.actorName` — fallback actor name cho các type khác
  - `payload.token` — raw invite token (chỉ `WORKSPACE_INVITE`), dùng navigate `/workspaces/invitation?token=<token>`
  - `payload.newRole`, `payload.oldRole` — cho `WORKSPACE_ROLE_CHANGE`, `PROJECT_ROLE_UPDATED`
  - `payload.taskId`, `payload.projectId`, `payload.workspaceId` — cho `COMMENT_*` types (dùng xây deep-link URL)
- **Comment notification types**:
  - `COMMENT_MENTION` — gửi cho user bị mention trong comment; `referenceId` = commentId; navigate → task + `?commentId=<id>`
  - `COMMENT_REACTION` — gửi cho owner của comment khi ai đó thả icon; `referenceId` = commentId; navigate → task + `?commentId=<id>`
  - `COMMENT_TASK` — gửi cho assignees của task khi có comment mới; `referenceId` = commentId; navigate → task + `?commentId=<id>`
  - icon: `MessageSquare` (amber, COMMENT_MENTION), `SmilePlus` (pink, COMMENT_REACTION), `MessageCircle` (blue, COMMENT_TASK)
- **`WORKSPACE_REVIEW_REQUEST`** type (Sprint 9): backend gửi khi OWNER/MANAGER review join request. FE phát hiện approved vs rejected bằng cách kiểm tra `notification.referenceId !== null` (backend chỉ set `referenceId` khi APPROVED).
- **`WORKSPACE_JOIN_REQUEST` navigation**: navigate đến `/workspaces/${workspaceId}?tab=members` để manager review ngay.
- **WebSocket `createdAt` issue**: Backend `NotificationMessage` DTO (WebSocket push) không nhất thiết có `createdAt`. REST API entity luôn có. Fix 2 lớp: (1) fallback `new Date().toISOString()` trong `useNotificationSocket`; (2) IIFE guard `isNaN(d.getTime())` → `"just now"` trong `NotificationItem`.
- **Optimistic mark-as-read**: Click item → local state update + Redux `markRealtimeItemRead` + `decrementUnreadCount` → gọi `markAsRead` API async. Không chờ API response để cập nhật UI.

### Task Architecture

- **`taskApi`** (RTK Query): tag `'Task'` keyed by `taskId`, `PROJECT_{projectId}`, `SUBTASKS_{taskId}`. 8 endpoints: `getTasksByProject`, `searchTasks`, `getTaskById`, `getSubTasks`, `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask`.
- **Search contract hiện tại**:
  - `searchTasks` đang trả `ApiResponse<TaskResponse[]>`, chưa phải `ApiResponse<PageResponse<TaskResponse>>`.
  - `TaskSearchParams` hiện chỉ có `status`, `priority`, `assigneeId`, `keyword`, `dueDateFrom`, `dueDateTo`, `page`, `size`.
  - Chưa có typed support cho `sprintId` và `tagIds`.
- **Endpoint separation** (critical):
  - `updateTask` (`PUT /:taskId`) — full edit: title, description, priority, dates, assignees, position. Permission: MANAGER bất kỳ, MEMBER chỉ task mình tạo.
  - `updateTaskStatus` (`PATCH /:taskId/status`) — chỉ gửi `{status}`. Permission: MANAGER bất kỳ, MEMBER task mình tạo **hoặc được assign**.
  - FE gọi `updateTaskStatus` tại: drag-and-drop (TaskBoardPage), status dropdown (TaskDetailPage), subtask checkbox toggle (TaskDetailPage).
  - FE gọi `updateTask` tại: inline edit title/desc/dates/assignees/priority (TaskDetailPage), TaskFormSheet submit.
- **`_parentTaskId` pattern**: `updateTaskStatus` mutation nhận optional `_parentTaskId` (prefixed `_` để không gửi lên server) → dùng trong `invalidatesTags` để refresh subtasks list của parent task khi toggle subtask status.
- **TaskBoardPage** — 2 views, hiện trạng đã xác minh:
  - **Board view**: Kanban 4 cột (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`). Drag-and-drop dùng `@dnd-kit/core` (`DndContext`, `useDroppable`, `useDraggable`, `DragOverlay`).
  - **List view**: Flat paged list. Rows hiển thị title, priority badge, due date, assignees.
  - Chỉ hiển thị root tasks (filter `parentTaskId == null`).
  - Board mode hiện gọi search với `size: 200`, nên có rủi ro cắt dữ liệu khi project lớn.
  - List pagination hiện đang suy ra từ độ dài mảng response search, chưa phải server-backed pagination đầy đủ.
  - Deep-link từ `SprintManagementTab` và tag click trong `TaskDetailPage` đã tồn tại, nhưng `TaskBoardPage` hiện chưa tiêu thụ đầy đủ context `sprint/tag` từ URL theo trạng thái code đã xác minh.
  - Vấn đề follow-up được ghi riêng tại `Documents/task-loading-sprint-tag-issues.md`.
- **TaskDetailPage** — 2-column layout:
  - Left: title (click-to-edit), description (click-to-edit), subtasks (progress bar + list + quick-add).
  - Right sidebar: status Select, priority Select, start/end date (click-to-edit input[type=date]), assignees (add from project members, remove per-user), metadata (creator, timestamps).
  - Subtask toggle: checkbox gọi `updateTaskStatus` với `_parentTaskId` để invalidate parent's subtask list.

### Comment Architecture

- **`commentApi`** (RTK Query): tag `'Comment'` keyed by `TASK_{taskId}`. 8 endpoints: `getComments` (lazy cursor-based), `createComment`, `updateComment`, `deleteComment`, `addReaction`, `removeReaction`, `updateReaction`, `getReactionUsers` (lazy).
- **Optimistic reactions**: `CommentItem` giữ `localReactions: Record<string, number>` là bản sao của `comment.reactions` prop. Khi user toggle, update local state ngay → gọi API → rollback nếu lỗi. `prevReactionsRef` sync khi prop thay đổi từ cache (sau invalidation).
- **One-reaction-per-user**: `myCurrentReaction: string | null` (không dùng `Set<string>`). Logic toggle:
  - Case 1 — same icon → `removeReaction` (DELETE), set `myCurrentReaction = null`
  - Case 2 — no prior reaction → `addReaction` (POST), set `myCurrentReaction = icon`
  - Case 3 — switch to different icon → `updateReaction` (PATCH), set `myCurrentReaction = newIcon` (1 request thay vì DELETE + POST)
- **Reaction tooltip (hover)**: `ReactionButton` gọi `useLazyGetReactionUsersQuery({ commentId, icon }, { preferCacheValue: true })` khi `onMouseEnter`. Hiển thị up to 8 avatars + names + "+N others". Cache value được tái dùng nếu đã fetch trước.
- **@mention + mentionUserIds**: `CommentInput` theo dõi `/@(\w*)$/` trước cursor; sau khi user chọn → insert `@tag `. Khi submit/save, `extractMentionIds(text, members)` parse tất cả `@tag` token → map thành user IDs → gửi kèm `mentionUserIds` trong create/update request → backend tạo `COMMENT_MENTION` notification cho người được mention.
- **Cursor pagination**: `CommentSection` dùng lazy query. `loadInitial()` fetch từ đầu (cursor=undefined, limit=20) → replaces `allComments`. `loadMore()` dùng `allComments[allComments.length-1].id` làm cursor → append. `loadInitial()` được gọi lại sau mỗi create/update/delete.
- **1-level reply grouping**: `CommentSection` chia `allComments` thành `topLevel` (parentCommentId==null) và `repliesMap: Record<number, CommentResponse[]>`. Mỗi `CommentItem` nhận `replies` prop. `CommentItem` với `isReply=true` ẩn nút Reply để chặn nest thêm.
- **Permission check trong CommentItem**: `canEdit = currentUser?.id === comment.user.id`, `canDelete = canEdit || isManager`. `isManager` được truyền từ `CommentSection` (lấy từ `useGetCurrentUserRoleQuery(projectId)`).
- **Inline confirm pattern**: Delete dùng `confirmDelete: boolean` state để hiện "Are you sure?" inline (không mở Dialog/Modal).
- **Comment notification deep-link**:
  - URL format: `/workspaces/:wid/projects/:pid/tasks/:tid?commentId=<id>` (backend gửi `taskId`, `projectId`, `workspaceId` trong notification payload; `referenceId` = commentId)
  - `CommentSection` đọc `commentId` từ `useSearchParams` → chạy "chase" loop: nếu ID chưa có trong `allComments`, tự động fetch trang tiếp cho đến khi tìm thấy rồi set `highlightedCommentId`
  - `CommentItem` nhận `highlightedCommentId` prop: nếu match → `ring-2 ring-primary shadow-sm` + `scrollIntoView({ behavior: "smooth", block: "center" })`
  - Replies tự expand (`showReplies = true` khi bất kỳ reply nào là target); prop truyền xuống nested `CommentItem` replies
  - Highlight tự xóa khi user click bất kỳ đâu (`document` click listener, `once: true`, defer 400ms)

### Việc cần làm tiếp theo

- ~~**Tasks (Sprint tiếp)**~~: ✅ Task Board (Kanban + List) + Task Detail đã implement. Route `/workspaces/:id/projects/:projectId/tasks` và `/:taskId`. FE đã tách đúng `updateTask` vs `updateTaskStatus` endpoint theo permission model.
- ~~**Comment System (Sprint 10)**~~: ✅ Đã hoàn thành. CommentSection, CommentItem (reactions + 1-per-user + hover tooltip + @mention + mentionUserIds + notification deep-link highlight), CommentInput, commentApi (8 endpoints), cursor pagination, COMMENT_REACTION + COMMENT_TASK notification types.
- **Task loading theo Sprint/Tag — follow-up contract review**: đã xác minh lệch pha giữa deep-link UI và search contract hiện tại. Các vấn đề cùng thứ tự xử lý được ghi tại `Documents/task-loading-sprint-tag-issues.md`.
  - Cần xem lại contract `searchTasks` để hỗ trợ `sprintId` và `tagIds`.
  - Cần đồng bộ URL params với filter state của `TaskBoardPage`.
  - Cần thay list pagination giả lập bằng pagination thật nếu tiếp tục dùng search endpoint cho list view.
- **Workspace Join Request — backend alignment**: `WorkspaceJoinRequestResponse.java` cần embed `UserSummaryResponse` (thay vì chỉ `userId: Long`) để FE hiển thị tên/avatar trong Join Requests section của `WorkspaceMembersTab`.
- **Notification — Project Join Request deep-link**: `PROJECT_JOIN_REQUEST` notification nên navigate đến tab Join Requests của ProjectDetailPage (đã có pattern với `?tab=` cho workspace, cần làm tương tự cho project).
- **Khi backend user API sẵn sàng**:
  - Thay mock data bằng `GET /users/me` (đã tích hợp sẵn trong `MainLayout` qua `useGetCurrentUserQuery`)
  - Submit `ProfilePage` (tab Info) qua `PUT /users/me` — logic đã có sẵn, chỉ cần backend up
- **`EditProfilePage.tsx`**: có thể xóa bỏ khi cần dọn dẹp codebase (hiện không được route đến trực tiếp, chỉ redirect về `/profile`).
- **My Tasks, Calendar, Analytics, Settings**: hiện là `PlaceholderPage`, chờ implement.
