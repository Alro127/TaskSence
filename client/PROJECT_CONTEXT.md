# TaskSense - Frontend Project Context

> File này dùng để giữ context cho AI và developers. Cập nhật sau mỗi sprint/thay đổi lớn.

## 📋 Thông tin dự án

- **Tên dự án**: TaskSense - Hệ thống quản lý công việc và hiệu suất
- **Frontend Stack**: React 19 + Vite 7 + TypeScript 5.9
- **UI Library**: shadcn/ui + Tailwind CSS v4
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod validation
- **Toast**: Sonner (shadcn/ui integration)

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
- **Workspace Endpoints**:
  - `POST /workspaces` → body: `{name, description?}` → `WorkspaceResponse`
  - `GET /workspaces` → danh sách workspace của current user
  - `GET /workspaces/:id` → chi tiết 1 workspace
  - `PUT /workspaces/:id` → body: `{name?, description?}` → `WorkspaceResponse`
  - `DELETE /workspaces/:id` → xóa workspace
- **User Skill Endpoints**:
  - `GET /users/me/skills` → danh sách skill của current user
  - `GET /users/:userId/skills` → danh sách skill của user khác (view-only)
  - `POST /users/me/skills` → body: `{skillName, level (1-5)}` → `UserSkillResponse`
  - `PUT /users/me/skills/:skillId` → body: `{skillName, level}` → `UserSkillResponse`
  - `DELETE /users/me/skills/:skillId` → xóa skill
- **API Response format**: `{code: string, message: string, data: T}`
- **CORS allowed**: `http://localhost:5173`
- **JWT**: Access Token + Refresh Token
- **context-path**: `/api/v1`

## 🗂️ Cấu trúc thư mục FE (hiện tại)

```text
client/
├── src/
│   ├── app/
│   │   ├── store.ts          ← Đã thêm workspaceApi + workspaceReducer + userSkillApi
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
│   │   │   └── pages/DashboardPage.tsx   ← Đã thêm WorkspaceSection
│   │   ├── user/
│   │   │   ├── api/
│   │   │   │   ├── userApi.ts             ← getUserById trả về ApiResponse<User> (đầy đủ fields)
│   │   │   │   └── userSkillApi.ts       ← RTK Query CRUD cho skills
│   │   │   ├── components/
│   │   │   │   ├── AvatarUpload.tsx
│   │   │   │   ├── SkillStars.tsx        ← ★ Star rating (display + interactive)
│   │   │   │   ├── SkillsSection.tsx     ← Skills tab: list + inline add/edit
│   │   │   │   ├── UserProfileCard.tsx
│   │   │   │   └── UserProfileDrawer.tsx ← Sheet xem profile người khác (view-only)
│   │   │   ├── hooks/
│   │   │   │   └── useAvatarUpload.ts
│   │   │   ├── pages/
│   │   │   │   ├── EditProfilePage.tsx   ← Giữ lại, /dashboard/edit-profile redirect → /profile
│   │   │   │   └── ProfilePage.tsx       ← /profile (2 tabs: Info + Skills)
│   │   │   └── userSlice.ts
│   │   └── workspace/                    ← NEW FEATURE
│   │       ├── api/workspaceApi.ts       ← RTK Query CRUD endpoints
│   │       ├── workspaceSlice.ts         ← pinnedIds + recentIds (localStorage)
│   │       ├── components/
│   │       │   ├── WorkspaceCard.tsx     ← Card với pin toggle + 3-dot menu
│   │       │   ├── WorkspaceCardGhost.tsx ← Ghost "New Workspace" card
│   │       │   ├── CreateWorkspaceModal.tsx
│   │       │   ├── EditWorkspaceModal.tsx
│   │       │   ├── DeleteWorkspaceDialog.tsx ← Type-to-confirm
│   │       │   └── index.ts
│   │       └── pages/
│   │           ├── WorkspacesPage.tsx    ← /workspaces
│   │           ├── WorkspaceDetailPage.tsx ← /workspaces/:id
│   │           └── index.ts
│   │   └── team-template/                ← Sprint 5
│   │       ├── api/
│   │       │   ├── teamTemplateApi.ts    ← RTK Query CRUD
│   │       │   └── teamMemberTemplateApi.ts ← RTK Query members
│   │       ├── components/
│   │       │   ├── TeamTemplateCard.tsx
│   │       │   ├── TeamTemplateCardGhost.tsx
│   │       │   ├── CreateTeamTemplateModal.tsx
│   │       │   ├── EditTeamTemplateModal.tsx
│   │       │   ├── DeleteTeamTemplateDialog.tsx ← Type-to-confirm
│   │       │   ├── AddMembersModal.tsx   ← Search + batch add
│   │       │   └── index.ts
│   │       └── pages/
│   │           ├── TeamTemplatesPage.tsx  ← /team-templates
│   │           ├── TeamTemplateDetailPage.tsx ← /team-templates/:id
│   │           └── index.ts
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   └── MainLayout.tsx    ← Sidebar "Profile" trỏ sang /profile; "Team Templates" → /team-templates
│   ├── routes/index.tsx      ← /profile (ProfilePage), /team-templates, /team-templates/:id
│   ├── types/api.ts          ← Đã thêm Workspace, TeamTemplate, TeamMemberTemplate,
│   │                            AddTeamMemberResultItem, MemberAddStatus, UserSearchResult,
│   │                            UserSkill, UserSkillRequest
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

## 📝 Quyết định thiết kế hiện tại

1. **Ưu tiên trang chủ sau login**: tập trung task board, không hiển thị profile trực tiếp trong dashboard body.
2. **Profile access**: mở bằng **drawer bên phải** từ avatar/header.
3. **Sidebar**: hiển thị icon + label (Dashboard, My Tasks, Calendar, Analytics, Profile, Settings).
4. **Profile page** (`/profile`):
   - 2 tabs: **Info** và **Skills**
   - Route cũ `/dashboard/edit-profile` redirect sang `/profile` để backward compat
   - Sidebar "Profile" trỏ thẳng vào `/profile`
5. **Profile fields** (tab Info):
   - Read-only: `email`
   - Editable: `fullName`, `phone`, `gender`, `dob`, `bio`
   - **Avatar upload** (UPDATED):
     - Vị trí: tab Info trong ProfilePage (phía trên các field khác)
     - Preview: square 1:1 aspect ratio (centered, rounded-lg)
     - Max file size: 5MB
     - Allowed formats: JPG, PNG, WebP
     - UX Flow:
       1. User nhấn "Choose Image" → select file
       2. Validate file (size, type) + create preview
       3. Preview hiển thị, có nút "Choose Different" để đổi ảnh hoặc "X" để cancel
       4. User nhấn "Save Changes" (form button) → check nếu có avatar selected
       5. Nếu có avatar: gọi `POST /media/presign/avatar` để lấy presigned URL
       6. Upload file trực tiếp lên S3 sử dụng presigned URL
       7. Lấy `fileUrl` từ response
       8. Gắn `avatarUrl: fileUrl` vào request payload update profile
       9. Gọi `PUT /users/me` với full profile data (có avatarUrl)
       10. Redux invalidates "User" tag + UI update reflect changes
       11. Preview cleared, toast success
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
   - **Projects tab**: hiện mock data (`MOCK_PROJECTS` constant trong file). Khi backend Project API sẵn sàng thì thay bằng RTK Query.
   - **Settings tab**: form chỉnh sửa inline (không navigate sang trang khác). Nút Save chỉ enable khi `isDirty`. Danger Zone có nút Delete mở `DeleteWorkspaceDialog`.
   - Khi delete thành công từ detail page: navigate về `/workspaces`.
10. **Delete workflow**: Bắt buộc gõ lại đúng tên workspace (paste bị chặn bằng `onPaste preventDefault`). Nút delete disabled cho đến khi text khớp.

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

### Workspace Architecture

- **`workspaceApi`** (RTK Query): tag `'Workspace'` — tất cả mutation đều invalidate tag này.
- **`workspaceSlice`**: chỉ lưu state local (`pinnedIds`, `recentIds`), không cache workspace data. Workspace data đến từ RTK Query cache.
- **`WorkspaceCard`** nhận `onEdit` / `onDelete` callback → page-level state quản lý modal target (`editTarget`, `deleteTarget`). Pattern này dùng chung cho cả `WorkspacesPage` và `WorkspaceDetailPage`.
- **Mock projects** nằm trong `WorkspaceDetailPage.tsx` như constant `MOCK_PROJECTS`. Khi backend Project API ready:
  - Tạo `features/project/api/projectApi.ts`
  - Thay `MOCK_PROJECTS` bằng `useGetProjectsByWorkspaceQuery(workspaceId)`
  - Mở ghost card "New Project" (hiện đang `cursor-not-allowed` + `disabled`)
- **Routing patterns**: `/workspaces` và `/workspaces/:id` đều nằm trong `MainLayout` (authenticated).

### Việc cần làm khi backend workspace/project API sẵn sàng

- `WorkspacesPage`: hiện dùng real API qua `useGetMyWorkspacesQuery` — **đã hoạt động**, chỉ cần backend chạy.
- `WorkspaceDetailPage`: cập nhật thông tin workspace từ `useGetWorkspaceByIdQuery` — **đã hoạt động**.
- `WorkspaceDetailPage` Projects tab: thay `MOCK_PROJECTS` bằng RTK Query call thực.
- `Members tab`: implement khi có API member management.
- Khi backend user API sẵn sàng:
  - thay mock data bằng `GET /users/me` (đã tích hợp sẵn trong `MainLayout`)
  - submit `ProfilePage` (tab Info) qua `PUT /users/me` — logic đã có sẵn
- Profile drawer là entry chính cho thông tin cá nhân ở giai đoạn hiện tại.

### Việc cần làm cho User Skills

- API đã sẵn sàng (`userSkillApi`), chỉ cần backend chạy.
- Khi muốn hiển thị skill của user khác (ví dụ trang profile public): dùng `<SkillsSection userId={targetUserId} />`.
- `EditProfilePage.tsx` có thể xóa bỏ khi cần dọn dẹp codebase (hiện không được route đến trực tiếp).
