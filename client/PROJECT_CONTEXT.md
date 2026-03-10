# TaskSense - Frontend Project Context

> File này dùng để giữ context cho AI và developers. Cập nhật sau mỗi sprint/thay đổi lớn.
> **Cập nhật lần cuối**: Sprint 9 - Task CRUD & Permission System
> **Cập nhật lần cuối**: Sprint 9 - Workspace Join Request + Notification Enhancements

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
- **Project Join Request Endpoints**:
  - `POST /projects/:projectId/join-requests` → body: `{message?}` → `ProjectJoinRequest`
  - `GET /projects/:projectId/join-requests` → danh sách join requests → `ProjectJoinRequest[]`
  - `PATCH /projects/:projectId/join-requests/:requestId/review` → body: `{status: "APPROVED"|"REJECTED"}` → `ProjectJoinRequest`
  - `DELETE /projects/:projectId/join-requests/:requestId` → huỷ join request
- **Task Endpoints**:
  - `POST /projects/:projectId/tasks` → body: `CreateTaskRequest` → `TaskResponse` _(MANAGER, MEMBER)_
  - `GET /projects/:projectId/tasks` → danh sách tasks của project → `TaskResponse[]` _(tất cả roles)_
  - `GET /projects/:projectId/tasks/search?status=&keyword=&cursor=&size=` → tìm kiếm task (cursor-based) → `TaskResponse[]` _(tất cả roles)_
  - `GET /projects/:projectId/tasks/:taskId` → chi tiết task → `TaskResponse` _(tất cả roles)_
  - `GET /projects/:projectId/tasks/:taskId/subtasks` → danh sách subtask → `TaskResponse[]` _(tất cả roles)_
  - `PUT /projects/:projectId/tasks/:taskId` → body: `UpdateTaskRequest` → `TaskResponse` _(MANAGER: bất kỳ task; MEMBER: chỉ task mình tạo)_
  - `PATCH /projects/:projectId/tasks/:taskId/status` → body: `{status}` → `TaskResponse` _(MANAGER: bất kỳ; MEMBER: task mình tạo hoặc được assign)_
  - `DELETE /projects/:projectId/tasks/:taskId` → xóa task (soft delete) _(MANAGER: bất kỳ; MEMBER: chỉ task mình tạo)_
- **Workspace Join Request Endpoints**:
  - `POST /workspaces/:workspaceId/join-requests` → body: `{message?}` → `WorkspaceJoinRequest`
  - `GET /workspaces/:workspaceId/join-requests` → danh sách join requests (OWNER/MANAGER) → `WorkspaceJoinRequest[]`
  - `PATCH /workspaces/:workspaceId/join-requests/:requestId/review` → body: `{status: "APPROVED"|"REJECTED"}` → `WorkspaceJoinRequest`
  - `DELETE /workspaces/:workspaceId/join-requests/:requestId` → huỷ join request
- **Workspace Explore Endpoints**:
  - `GET /workspaces/search?name=...&cursor=...&limit=...` → tìm kiếm public workspaces → `WorkspaceResponse[]`
  - `GET /workspaces/public/:userId` → danh sách public workspaces của user khác → `WorkspaceResponse[]`
- **Notification Endpoints**:
  - `GET /notifications/unread-count` → số thông báo chưa đọc → `number`
  - `POST /notifications/:id/read` → đánh dấu 1 thông báo là đã đọc
  - `POST /notifications/read-all` → đánh dấu tất cả là đã đọc → số lượng đã update
  - `DELETE /notifications/:id` → xóa 1 thông báo
  - `DELETE /notifications` → body: `{ids: number[]}` → xóa nhiều thông báo
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
│   │   ├── store.ts          ← Đã thêm notificationApi + notificationReducer
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
│   │   │   │   ├── projectMemberApi.ts    ← RTK Query member management
│   │   │   │   └── projectJoinRequestApi.ts ← RTK Query join request management
│   │   │   ├── components/
│   │   │   │   ├── ProjectCard.tsx        ← Card + STATUS_CONFIG + ROLE_LABEL exports
│   │   │   │   ├── ProjectCardGhost.tsx   ← Ghost "New Project" card
│   │   │   │   ├── EditProjectModal.tsx   ← Edit project dialog (name, desc, status, dates)
│   │   │   │   ├── DeleteProjectDialog.tsx← Type-to-confirm delete
│   │   │   │   ├── MemberCard.tsx         ← Member card với role badge + change role/remove
│   │   │   │   ├── AddMembersModal.tsx    ← Thêm member từ workspace members list
│   │   │   │   └── index.ts
│   │   │   └── pages/
│   │   │       ├── CreateProjectPage.tsx  ← /workspaces/:id/projects/new (full form)
│   │   │       ├── ProjectDetailPage.tsx  ← /workspaces/:id/projects/:projectId (4 tabs)
│   │   │       └── index.ts
│   │   ├── task/                            ← Sprint 9 FE — Task Board & Detail
│   │   │   ├── api/
│   │   │   │   └── taskApi.ts              ← RTK Query: 8 endpoints (CRUD + search + subtasks + updateTaskStatus)
│   │   │   ├── components/
│   │   │   │   └── TaskFormSheet.tsx        ← Sheet tạo/sửa task (RHF + Zod)
│   │   │   └── pages/
│   │   │       ├── TaskBoardPage.tsx        ← Kanban board (drag-and-drop) + List view
│   │   │       ├── TaskDetailPage.tsx       ← Chi tiết task + inline edit + subtasks
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
   │                            Notification (incl. WORKSPACE_REVIEW_REQUEST), etc.
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
- ✅ **workspaceMemberApi** — RTK Query với 3 endpoints: `getWorkspaceMembers`, `updateMemberRole`, `removeMember`
- ✅ **workspaceInviteApi** — RTK Query với 5 endpoints: `getWorkspaceInvites`, `inviteMember`, `acceptInvite`, `revokeInvite`, `bulkInviteMembers`
- ✅ **WorkspaceMembersTab** (`features/workspace/components/WorkspaceMembersTab.tsx`):
  - Section **Members**: list tất cả members với avatar, tên, email, role badge
  - Click avatar/tên → mở `UserProfileDrawer` (reuse pattern từ Team Template)
  - 3-dot menu per row (chỉ hiện nếu current user có quyền manage member đó):
    - **Change Role**: submenu với danh sách roles → gọi `PATCH` API ngay
    - **Remove**: mở confirmation Dialog
  - Section **Pending Invitations** (chỉ OWNER/MANAGER thấy): list pending invites với nút Revoke
  - Nút **Invite Member** (chỉ OWNER/MANAGER): mở `BulkInviteModal`
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
  - `NotificationType` type: 9 loại — `TASK_ASSIGNED`, `WORKSPACE_INVITE`, `WORKSPACE_INVITE_ACCEPT`, `WORKSPACE_JOIN_REQUEST`, `WORKSPACE_REMOVE_MEMBER`, `WORKSPACE_ROLE_CHANGE`, `PROJECT_JOIN_REQUEST`, `COMMENT_MENTION`, `PROJECT_ROLE_UPDATED`
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
  - **Members tab**: Grid `MemberCard` component. "Add Members" button cho MANAGER.
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
  - `getPublicWorkspaces(userId)` → `GET /workspaces/public/:userId` (public workspaces của user khác)
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

| Path                                                | Component                 | Ghi chú                                                                          |
| --------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| `/`                                                 | → `/dashboard`            | redirect                                                                         |
| `/auth/login`                                       | `LoginPage`               | trong `AuthLayout`                                                               |
| `/auth/register`                                    | `RegisterPage`            |                                                                                  |
| `/auth/verify-otp`                                  | `VerifyOtpPage`           |                                                                                  |
| `/auth/forgot-password`                             | `ForgotPasswordPage`      |                                                                                  |
| `/auth/reset-password`                              | `ResetPasswordPage`       |                                                                                  |
| `/dashboard`                                        | `DashboardPage`           | trong `MainLayout`                                                               |
| `/dashboard/edit-profile`                           | → `/profile`              | redirect (backward compat)                                                       |
| `/profile`                                          | `ProfilePage`             | 2 tabs: Info + Skills                                                            |
| `/workspaces`                                       | `WorkspacesPage`          | Pinned / Recent / All                                                            |
| `/workspaces/explore`                               | `WorkspaceExplorePage`    | Search public workspaces; **phải đứng trước `/workspaces/invitation` và `/:id`** |
| `/workspaces/invitation`                            | `WorkspaceInvitationPage` | **phải đứng trước `:id`**                                                        |
| `/workspaces/:id`                                   | `WorkspaceDetailPage`     | 3 tabs: Projects / Members / Settings; hỗ trợ `?tab=` query param                |
| `/workspaces/:id/projects/new`                      | `CreateProjectPage`       |                                                                                  |
| `/workspaces/:id/projects/:projectId`               | `ProjectDetailPage`       | 4 tabs                                                                           |
| `/workspaces/:id/projects/:projectId/tasks`         | `TaskBoardPage`           | Kanban board + List view; drag-and-drop đổi status                               |
| `/workspaces/:id/projects/:projectId/tasks/:taskId` | `TaskDetailPage`          | Chi tiết task + inline edit + subtasks                                           |
| `/team-templates`                                   | `TeamTemplatesPage`       |                                                                                  |
| `/team-templates/:id`                               | `TeamTemplateDetailPage`  | 2 tabs: Members + Settings                                                       |
| `/tasks`                                            | `PlaceholderPage`         | mock                                                                             |
| `/calendar`                                         | `PlaceholderPage`         | mock                                                                             |
| `/analytics`                                        | `PlaceholderPage`         | mock                                                                             |
| `/settings`                                         | `PlaceholderPage`         | mock                                                                             |
| `*`                                                 | → `/auth/login`           | catch-all                                                                        |

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
    - 4 tabs: Overview / Tasks / Members / Join Requests.
    - **Tasks tab**: placeholder, chờ sprint sau.
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
- **`WORKSPACE_REVIEW_REQUEST`** type (Sprint 9): backend gửi khi OWNER/MANAGER review join request. FE phát hiện approved vs rejected bằng cách kiểm tra `notification.referenceId !== null` (backend chỉ set `referenceId` khi APPROVED).
- **`WORKSPACE_JOIN_REQUEST` navigation**: navigate đến `/workspaces/${workspaceId}?tab=members` để manager review ngay.
- **WebSocket `createdAt` issue**: Backend `NotificationMessage` DTO (WebSocket push) không nhất thiết có `createdAt`. REST API entity luôn có. Fix 2 lớp: (1) fallback `new Date().toISOString()` trong `useNotificationSocket`; (2) IIFE guard `isNaN(d.getTime())` → `"just now"` trong `NotificationItem`.
- **Optimistic mark-as-read**: Click item → local state update + Redux `markRealtimeItemRead` + `decrementUnreadCount` → gọi `markAsRead` API async. Không chờ API response để cập nhật UI.

### Task Architecture

- **`taskApi`** (RTK Query): tag `'Task'` keyed by `taskId`, `PROJECT_{projectId}`, `SUBTASKS_{taskId}`. 8 endpoints: `getTasksByProject`, `searchTasks`, `getTaskById`, `getSubTasks`, `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask`.
- **Endpoint separation** (critical):
  - `updateTask` (`PUT /:taskId`) — full edit: title, description, priority, dates, assignees, position. Permission: MANAGER bất kỳ, MEMBER chỉ task mình tạo.
  - `updateTaskStatus` (`PATCH /:taskId/status`) — chỉ gửi `{status}`. Permission: MANAGER bất kỳ, MEMBER task mình tạo **hoặc được assign**.
  - FE gọi `updateTaskStatus` tại: drag-and-drop (TaskBoardPage), status dropdown (TaskDetailPage), subtask checkbox toggle (TaskDetailPage).
  - FE gọi `updateTask` tại: inline edit title/desc/dates/assignees/priority (TaskDetailPage), TaskFormSheet submit.
- **`_parentTaskId` pattern**: `updateTaskStatus` mutation nhận optional `_parentTaskId` (prefixed `_` để không gửi lên server) → dùng trong `invalidatesTags` để refresh subtasks list của parent task khi toggle subtask status.
- **TaskBoardPage** — 2 views:
  - **Board view**: Kanban 4 cột (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`). Drag-and-drop dùng `@dnd-kit/core` (`DndContext`, `useDroppable`, `useDraggable`, `DragOverlay`).
  - **List view**: Grouped by status, mỗi group collapsible. Rows hiển thị title, priority badge, due date, assignees.
  - Chỉ hiển thị root tasks (filter `parentTaskId == null`).
- **TaskDetailPage** — 2-column layout:
  - Left: title (click-to-edit), description (click-to-edit), subtasks (progress bar + list + quick-add).
  - Right sidebar: status Select, priority Select, start/end date (click-to-edit input[type=date]), assignees (add from project members, remove per-user), metadata (creator, timestamps).
  - Subtask toggle: checkbox gọi `updateTaskStatus` với `_parentTaskId` để invalidate parent's subtask list.

### Việc cần làm tiếp theo

- ~~**Tasks (Sprint tiếp)**~~: ✅ Task Board (Kanban + List) + Task Detail đã implement. Route `/workspaces/:id/projects/:projectId/tasks` và `/:taskId`. FE đã tách đúng `updateTask` vs `updateTaskStatus` endpoint theo permission model.
- **Workspace Join Request — backend alignment**: `WorkspaceJoinRequestResponse.java` cần embed `UserSummaryResponse` (thay vì chỉ `userId: Long`) để FE hiển thị tên/avatar trong Join Requests section của `WorkspaceMembersTab`.
- **Workspace Join Request UI — từ ProjectDetailPage**: Non-member của project cũng có thể cần thấy "Request to Join" button tương tự pattern workspace; hiện chỉ có FE API hook, chưa có UI trigger.
- **Notification — Project Join Request deep-link**: `PROJECT_JOIN_REQUEST` notification nên navigate đến tab Join Requests của ProjectDetailPage (đã có pattern với `?tab=` cho workspace, cần làm tương tự cho project).
- **Khi backend user API sẵn sàng**:
  - Thay mock data bằng `GET /users/me` (đã tích hợp sẵn trong `MainLayout` qua `useGetCurrentUserQuery`)
  - Submit `ProfilePage` (tab Info) qua `PUT /users/me` — logic đã có sẵn, chỉ cần backend up
- **`EditProfilePage.tsx`**: có thể xóa bỏ khi cần dọn dẹp codebase (hiện không được route đến trực tiếp, chỉ redirect về `/profile`).
- **My Tasks, Calendar, Analytics, Settings**: hiện là `PlaceholderPage`, chờ implement.
