# TaskSense - Design System

> Tất cả component và giao diện mới **PHẢI** tuân thủ theo quy tắc trong file này để đảm bảo sự nhất quán.

## 🎨 Color Palette

### Primary Colors (Blue)

| Token                | Usage                        | Tailwind Class               |
| -------------------- | ---------------------------- | ---------------------------- |
| `primary`            | Buttons, links, active state | `bg-primary`, `text-primary` |
| `primary-foreground` | Text trên primary background | `text-primary-foreground`    |

### Semantic Colors

| Token              | Usage                        | Tailwind Class          |
| ------------------ | ---------------------------- | ----------------------- |
| `background`       | Page background              | `bg-background`         |
| `foreground`       | Main text color              | `text-foreground`       |
| `muted`            | Subtle backgrounds           | `bg-muted`              |
| `muted-foreground` | Secondary text, placeholders | `text-muted-foreground` |
| `card`             | Card backgrounds             | `bg-card`               |
| `border`           | Borders, dividers            | `border-border`         |
| `destructive`      | Error states, delete actions | `bg-destructive`        |
| `accent`           | Hover highlights, tags       | `bg-accent`             |

### Custom Extended Colors (dùng trực tiếp Tailwind classes)

| Color         | Hex       | Usage                     | Class            |
| ------------- | --------- | ------------------------- | ---------------- |
| Success Green | `#22C55E` | Success states, completed | `text-green-500` |
| Warning Amber | `#F59E0B` | Warning, caution          | `text-amber-500` |
| Info Blue     | `#3B82F6` | Informational messages    | `text-blue-500`  |

## 📐 Typography

### Font Family

- **Primary**: `Inter` (import from Google Fonts nếu cần, hoặc dùng system-ui fallback)
- Đã set mặc định qua Tailwind: `font-sans`

### Font Sizes (dùng Tailwind classes)

| Element       | Class                   | Size |
| ------------- | ----------------------- | ---- |
| Page Title    | `text-2xl font-bold`    | 24px |
| Section Title | `text-xl font-semibold` | 20px |
| Card Title    | `text-lg font-semibold` | 18px |
| Body          | `text-sm`               | 14px |
| Small/Caption | `text-xs`               | 12px |
| Label         | `text-sm font-medium`   | 14px |

## 📦 Spacing

Dùng Tailwind spacing scale:
| Usage | Class | Value |
|--------------------|----------------|---------|
| Page padding | `p-6` | 24px |
| Card padding | `p-6` | 24px |
| Section gap | `gap-6` | 24px |
| Element gap (form) | `gap-4` | 16px |
| Inline gap | `gap-2` | 8px |
| Tight gap | `gap-1` | 4px |

## 🔲 Border Radius

Sử dụng shadcn/ui radius tokens:
| Element | Class |
|------------|---------------|
| Button | `rounded-md` |
| Card | `rounded-lg` |
| Input | `rounded-md` |
| Badge | `rounded-full`|
| Modal | `rounded-lg` |

## 🔘 Button Variants

Sử dụng shadcn/ui Button component:

```tsx
// Primary action
<Button>Submit</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Ghost (hover only)
<Button variant="ghost">More</Button>

// Outline
<Button variant="outline">Back</Button>

// Link style
<Button variant="link">Learn more</Button>

// With icon
<Button><Icon className="mr-2 h-4 w-4" /> Label</Button>

// Loading state
<Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</Button>
```

### Button Sizes

| Size      | Class            | Height |
| --------- | ---------------- | ------ |
| Default   | `size="default"` | 36px   |
| Small     | `size="sm"`      | 32px   |
| Large     | `size="lg"`      | 40px   |
| Icon only | `size="icon"`    | 36x36  |

## 📝 Form Fields

### Input Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="name@example.com" />
  {error && <p className="text-sm text-destructive">{error}</p>}
</div>
```

### Validation States

- **Error**: `border-destructive` + error message below
- **Disabled**: Dùng `disabled` attribute (opacity tự động giảm)
- **Focus**: Ring `ring-ring` (mặc định shadcn)

## 🏗️ Layout Patterns

### Auth Pages Layout

- Split layout: trái (branding/illustration) + phải (form)
- Mobile: chỉ hiện form, ẩn illustration
- Max width form area: `max-w-md` (448px)
- Center vertically: `flex items-center justify-center min-h-screen`

### Main App Layout (Current)

- Sidebar + Main content area
- Sidebar width: 256px
- Top header: 64px height
- Dashboard body ưu tiên hiển thị task board
- Profile không đặt trực tiếp trong dashboard content
- Truy cập profile qua avatar button (mở right drawer)

### User Profile Card (Sprint 2)

- **Layout**: Horizontal flex with avatar on left, info on right
- **Avatar**: 120px square, rounded-lg, image or fallback icon
- **Info Section**: Grid layout (2 columns for metadata)
- **Sections**:
  - Name + Email (always visible)
  - Metadata grid: Phone, Gender, Date of Birth (optional)
  - Bio section (optional, with border-top separator)
  - Edit button (if edit handler provided)
- **Responsive**: Flex to stack on mobile if needed
- **Spacing**: gap-6 between avatar and info, gap-4 for grid

### Profile Access Pattern (Sprint 2)

- **Primary access**: Avatar button ở header
- **Interaction**: Mở right drawer chứa profile summary + quick actions
- **Quick actions**:
  - Edit Profile (navigate `/dashboard/edit-profile`)
  - Logout

## 🔔 Toast/Notification

Dùng `sonner` (tích hợp shadcn):

```tsx
import { toast } from "sonner";

// Success
toast.success("Đăng ký thành công!");

// Error
toast.error("Email hoặc mật khẩu không đúng");

// Info
toast.info("OTP đã được gửi đến email của bạn");

// With description
toast.success("Chào mừng!", {
  description: "Bạn đã đăng nhập thành công",
});
```

## 📱 Responsive Breakpoints

Dùng Tailwind default breakpoints:
| Breakpoint | Min Width | Usage |
|------------|-----------|------------------------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

### Mobile-first Rules

- Base styles = mobile
- `md:` prefix cho tablet+
- `lg:` prefix cho desktop+

## 📋 Component Library

### Reusable Components Location: `src/components/`

| Component       | Location                    | Purpose                                                 |
| --------------- | --------------------------- | ------------------------------------------------------- |
| UI Components   | `components/ui/`            | shadcn/ui primitives (Button, Input, Label, Card, etc.) |
| LoadingSpinner  | `components/common/`        | Full-page or inline loading state                       |
| PasswordInput   | `components/common/`        | Password field with show/hide toggle                    |
| GoogleButton    | `components/common/`        | OAuth button wrapper                                    |
| UserProfileCard | `features/user/components/` | Profile display card (Avatar + Info)                    |

### Feature-specific Components Location: `src/features/[feature]/`

| Feature   | Components                       | Purpose               |
| --------- | -------------------------------- | --------------------- |
| auth      | LoginPage, RegisterPage, etc.    | Auth flows            |
| user      | UserProfileCard, EditProfilePage | Profile management    |
| dashboard | DashboardPage                    | Home page after login |

## ✅ Do's and Don'ts

### DO:

- Dùng shadcn/ui components khi có sẵn
- Dùng CSS variables (`bg-primary`, `text-muted-foreground`...) thay vì hardcode color
- Dùng Tailwind utility classes
- Dùng `cn()` utility để merge classes có điều kiện
- Đặt error messages dưới input fields
- Dùng `sonner` toast cho server responses

### DON'T:

- Hardcode hex colors trong component
- Tạo custom component khi shadcn đã có
- Dùng inline styles
- Mix CSS modules với Tailwind
- Sửa files trong `components/ui/` (auto-generated bởi shadcn)
