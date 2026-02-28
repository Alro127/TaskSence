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
  - `POST /api/auth/register` → body: `{email, password}` → gửi OTP email
  - `POST /api/auth/verify-otp?email=...&otp=...` → `{accessToken, refreshToken}`
  - `POST /api/auth/login` → body: `{email, password}` → `{accessToken, refreshToken}`
- **API Response format**: `{code: string, message: string, data: T}`
- **CORS allowed**: `http://localhost:5173`
- **JWT**: Access Token + Refresh Token
- **context-path**: `/api/v1` (set in server)

> ⚠️ **Lưu ý**: Backend chưa có endpoint Forgot Password và Google OAuth. FE đã xây dựng UI sẵn với mock, kết nối khi BE hoàn thành.

## 🗂️ Cấu trúc thư mục FE (Hiện tại)

```
client/
├── src/
│   ├── app/
│   │   ├── store.ts          # Redux store configuration
│   │   └── hooks.ts          # Typed useDispatch/useSelector
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── input-otp.tsx
│   │   └── common/           # Custom shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── PasswordInput.tsx  # Input with show/hide toggle
│   │       ├── GoogleButton.tsx   # Google OAuth button
│   │       └── index.ts
│   ├── features/
│   │   └── auth/
│   │       ├── api/
│   │       │   └── authApi.ts    # RTK Query auth endpoints
│   │       ├── pages/
│   │       │   ├── LoginPage.tsx
│   │       │   ├── RegisterPage.tsx
│   │       │   ├── VerifyOtpPage.tsx
│   │       │   ├── ForgotPasswordPage.tsx
│   │       │   └── index.ts
│   │       └── authSlice.ts      # Auth Redux slice (tokens, state)
│   ├── layouts/
│   │   └── AuthLayout.tsx        # Split layout (branding + form)
│   ├── lib/
│   │   └── utils.ts              # cn() utility (shadcn)
│   ├── routes/
│   │   └── index.tsx             # Route definitions
│   ├── types/
│   │   └── api.ts                # TypeScript types (API models)
│   ├── styles/                   # (reserved for future global styles)
│   ├── App.tsx                   # Root component (Router + Toaster)
│   ├── main.tsx                  # Entry point (Redux Provider)
│   └── index.css                 # Tailwind + shadcn theme variables
├── .env                          # Environment variables
├── .env.example
├── DESIGN_SYSTEM.md              # Quy tắc thiết kế
├── PROJECT_CONTEXT.md            # File này
├── components.json               # shadcn/ui config
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

## 🚀 Sprint Progress

### Sprint 1 - Authentication (Current) ✅

| Feature          | Status     | Notes                                        |
| ---------------- | ---------- | -------------------------------------------- |
| Login            | ✅ Done    | Email + Password, form validation, RTK Query |
| Register         | ✅ Done    | Email + Password + confirm, navigates to OTP |
| OTP Verification | ✅ Done    | 6-digit input, auto-submit, resend timer     |
| Forgot Password  | ✅ Done    | UI complete (BE endpoint chưa có, dùng mock) |
| Google OAuth     | ✅ UI Done | Button hiển thị, toast "coming soon"         |
| Auth Layout      | ✅ Done    | Split layout, responsive, branding left      |
| Routing          | ✅ Done    | React Router v6, auth guard                  |
| State Management | ✅ Done    | Redux Toolkit + RTK Query                    |

### Pending / Next Sprint

- [ ] Dashboard layout (sidebar + main)
- [ ] User profile
- [ ] Task management CRUD
- [ ] Performance analytics
- [ ] Google OAuth integration (khi BE sẵn sàng)
- [ ] Forgot Password API integration (khi BE sẵn sàng)
- [ ] Refresh token interceptor

## 📝 Quyết định thiết kế

1. **Theme**: Modern Minimalist, Blue primary (oklch 0.546 0.245 262.881 ≈ #2563EB)
2. **Layout auth pages**: Split layout - left side branding/features, right side form
3. **Form validation**: React Hook Form + Zod schemas
4. **Toast notifications**: Dùng sonner (tích hợp shadcn/ui), position top-right
5. **Responsive**: Mobile-first, ẩn left panel dưới lg breakpoint
6. **Routing guard**: AuthLayout redirect authenticated users to /dashboard
7. **Password rules**: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
8. **OTP**: 6 digits, auto-submit khi nhập đủ, resend cooldown 60s
9. **Token storage**: localStorage (accessToken, refreshToken)

## 🔧 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=<to-be-configured>
```

## 🛠️ Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## 📌 Lưu ý cho AI/Developer tiếp theo

- Đọc `DESIGN_SYSTEM.md` trước khi tạo component mới
- Tuân thủ color palette và spacing đã định nghĩa
- Sử dụng shadcn/ui components khi có thể, tránh tạo component từ đầu
- RTK Query handles caching và loading states - không cần tự quản lý
- Tất cả API calls đi qua RTK Query, không dùng fetch/axios trực tiếp
- `PasswordInput` đã hỗ trợ `forwardRef` cho react-hook-form
- Auth flow: Register → OTP Verify → Dashboard; Login → Dashboard
- ForgotPassword hiện đang mock (setTimeout), cần kết nối BE khi sẵn sàng
