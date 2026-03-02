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
- **API Response format**: `{code: string, message: string, data: T}`
- **CORS allowed**: `http://localhost:5173`
- **JWT**: Access Token + Refresh Token
- **context-path**: `/api/v1`

## 🗂️ Cấu trúc thư mục FE (hiện tại)

```text
client/
├── src/
│   ├── app/
│   │   ├── store.ts
│   │   └── hooks.ts
│   ├── components/
│   │   ├── ui/
│   │   └── common/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/authApi.ts
│   │   │   ├── pages/
│   │   │   └── authSlice.ts
│   │   ├── dashboard/
│   │   │   └── pages/DashboardPage.tsx
│   │   └── user/
│   │       ├── api/userApi.ts
│   │       ├── components/
│   │       │   ├── AvatarUpload.tsx (NEW)
│   │       │   └── UserProfileCard.tsx
│   │       ├── hooks/
│   │       │   └── useAvatarUpload.ts (NEW)
│   │       ├── pages/EditProfilePage.tsx
│   │       └── userSlice.ts
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   └── MainLayout.tsx
│   ├── routes/index.tsx
│   ├── types/api.ts
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

### Sprint 2 - Dashboard & Profile Layout ✅ IN PROGRESS

- ✅ Dashboard ưu tiên task management UI
- ✅ Kanban mini mock (`To Do / Doing / Done`) bằng mock cards
- ✅ Sidebar đầy đủ icon + label cho quick access
- ✅ Profile di dời khỏi dashboard content
- ✅ Profile drawer mở từ avatar button ở header (bên phải)
- ✅ Trang `Edit Profile` riêng (`/dashboard/edit-profile`)
- ✅ Mock pages cho quick access: `tasks`, `calendar`, `analytics`, `settings`
- ✅ **Avatar Upload** - FE integration (NEW)
  - ✅ Created `useAvatarUpload` hook for S3 upload logic
  - ✅ Created `AvatarUpload` component (square 1:1 preview + upload)
  - ✅ Integrated avatar upload into EditProfilePage
  - ✅ File validation (5MB max, JPG/PNG/WebP only)
  - ✅ Preview display before confirming upload
  - ✅ Loading spinner during S3 upload
- ⏳ Chờ backend user endpoints để bỏ mock data

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
- **Avatar Upload Architecture (UPDATED)**:
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
- Khi backend user API sẵn sàng:
  - thay mock data bằng `GET /user/me`
  - submit `EditProfilePage` qua `PUT /user/profile`
- Profile drawer là entry chính cho thông tin cá nhân ở giai đoạn hiện tại.
