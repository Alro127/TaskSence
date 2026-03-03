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
- **API Response format**: `{code: string, message: string, data: T}`
- **CORS allowed**: `http://localhost:5173`
- **JWT**: Access Token + Refresh Token
- **context-path**: `/api/v1`

## 🗂️ Cấu trúc thư mục FE (hiện tại)

```text
client/
├── src/
│   ├── app/
│   │   ├── store.ts          ← Đã thêm workspaceApi + workspaceReducer
│   │   └── hooks.ts
│   ├── components/
│   │   ├── ui/               ← Đã thêm: dialog, dropdown-menu, tabs, badge
│   │   └── common/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/authApi.ts
│   │   │   ├── pages/
│   │   │   └── authSlice.ts
│   │   ├── dashboard/
│   │   │   └── pages/DashboardPage.tsx   ← Đã thêm WorkspaceSection
│   │   ├── user/
│   │   │   ├── api/userApi.ts
│   │   │   ├── components/
│   │   │   │   ├── AvatarUpload.tsx
│   │   │   │   └── UserProfileCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAvatarUpload.ts
│   │   │   ├── pages/EditProfilePage.tsx
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
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   └── MainLayout.tsx    ← Đã thêm "Workspaces" vào sidebar nav
│   ├── routes/index.tsx      ← Đã thêm /workspaces và /workspaces/:id
│   ├── types/api.ts          ← Đã thêm Workspace, CreateWorkspaceRequest,
│   │                            UpdateWorkspaceRequest, MockProject
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

## 📝 Quyết định thiết kế hiện tại

1. **Ưu tiên trang chủ sau login**: tập trung task board, không hiển thị profile trực tiếp trong dashboard body.
2. **Profile access**: mở bằng **drawer bên phải** từ avatar/header.
3. **Sidebar**: hiển thị icon + label (Dashboard, My Tasks, Calendar, Analytics, Profile, Settings).
4. **Profile fields**:
   - Read-only: `email`
   - Editable: `fullName`, `phone`, `gender`, `dob`, `bio`
   - **Avatar upload** (UPDATED):
     - Vị trí: EditProfilePage (phía trên các field khác)
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
5. **Profile data hiện tại**: dùng mock data trong `userSlice` đến khi backend sẵn sàng.
6. **Workspace layout** (`/workspaces`):
   - **Pinned section**: user tự pin thủ công bằng nút ⭐ trên card. State lưu trong `localStorage` qua `workspaceSlice`.
   - **Recent section**: tự động track 5 workspace được mở gần nhất. Cũng lưu `localStorage`.
   - **Ghost card**: luôn hiện ở cuối grid "All workspaces" để tạo nhanh.
   - Khi xóa workspace: dispatch `removeFromPinnedAndRecent(id)` để dọn state local.
7. **Workspace Detail** (`/workspaces/:id`):
   - Breadcrumb: `Workspaces > [name]`.
   - 3 tabs: Projects / Members / Settings.
   - **Projects tab**: hiện mock data (`MOCK_PROJECTS` constant trong file). Khi backend Project API sẵn sàng thì thay bằng RTK Query.
   - **Settings tab**: form chỉnh sửa inline (không navigate sang trang khác). Nút Save chỉ enable khi `isDirty`. Danger Zone có nút Delete mở `DeleteWorkspaceDialog`.
   - Khi delete thành công từ detail page: navigate về `/workspaces`.
8. **Delete workflow**: Bắt buộc gõ lại đúng tên workspace (paste bị chặn bằng `onPaste preventDefault`). Nút delete disabled cho đến khi text khớp.

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
  - submit `EditProfilePage` qua `PUT /users/me`
- Profile drawer là entry chính cho thông tin cá nhân ở giai đoạn hiện tại.
