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

### Task Status Colors

Dùng nhất quán cho tất cả badge/tag thể hiện **trạng thái** task. Định nghĩa tập trung qua `taskStatusConfig`:

```tsx
// src/features/task/constants/taskStatus.ts
export const taskStatusConfig = {
  todo: { label: "To Do", className: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  done: { label: "Done", className: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  blocked: { label: "Blocked", className: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
} as const;

export type TaskStatus = keyof typeof taskStatusConfig;
```

> **Rule**: Chỉ thêm entry mới vào `taskStatusConfig` khi có status mới từ Backend. Không hardcode class status ở nơi khác.

### Task Priority Colors

Hệ thống riêng biệt cho **mức ưu tiên** task — không dùng chung với status. Định nghĩa tập trung qua `taskPriorityConfig`:

```tsx
// src/features/task/constants/taskPriority.ts
export const taskPriorityConfig = {
  low: {
    label: "Low",
    className: "text-slate-400",
    iconClass: "text-slate-400",
  },
  medium: {
    label: "Medium",
    className: "text-amber-500",
    iconClass: "text-amber-500",
  },
  high: {
    label: "High",
    className: "text-orange-500",
    iconClass: "text-orange-500",
  },
  urgent: {
    label: "Urgent",
    className: "text-red-600 font-semibold",
    iconClass: "text-red-600",
  },
} as const;

export type TaskPriority = keyof typeof taskPriorityConfig;
```

> **Rule**: Priority chỉ ảnh hưởng đến **text color + icon color**, không dùng background như status. Tách biệt hoàn toàn với `taskStatusConfig`.

---

## 📐 Typography

### Font Family

- **Primary**: `Inter` (import from Google Fonts nếu cần, hoặc dùng system-ui fallback)
- Đã set mặc định qua Tailwind: `font-sans`

### Font Sizes (dùng Tailwind classes)

| Element       | Class                                         | Size |
| ------------- | --------------------------------------------- | ---- |
| Page Title    | `text-2xl font-bold`                          | 24px |
| Section Title | `text-xl font-semibold`                       | 20px |
| Card Title    | `text-lg font-semibold`                       | 18px |
| Body          | `text-sm`                                     | 14px |
| Small/Caption | `text-xs`                                     | 12px |
| Label         | `text-sm font-medium`                         | 14px |
| Metadata/Date | `text-xs text-muted-foreground`               | 12px |
| Tag/Label     | `text-xs font-medium uppercase tracking-wide` | 12px |
| Empty state   | `text-sm text-muted-foreground text-center`   | 14px |

---

## 📦 Spacing

Dùng Tailwind spacing scale:
| Usage | Class | Value |
|--------------------|----------|-------|
| Page padding | `p-6` | 24px |
| Card padding | `p-6` | 24px |
| Section gap | `gap-6` | 24px |
| Element gap (form) | `gap-4` | 16px |
| Inline gap | `gap-2` | 8px |
| Tight gap | `gap-1` | 4px |

---

## 🔲 Border Radius

Sử dụng shadcn/ui radius tokens:
| Element | Class |
|---------|----------------|
| Button | `rounded-md` |
| Card | `rounded-lg` |
| Input | `rounded-md` |
| Badge | `rounded-full` |
| Modal | `rounded-lg` |

---

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

---

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

---

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

### Viewing Another User's Profile (Sprint 5+)

- **Trigger**: Click vào avatar hoặc tên user trong danh sách thành viên / kết quả tìm kiếm
- **Component**: `UserProfileDrawer` — Sheet trượt từ phải (`sm:max-w-md`)
- **Content**: 2 tabs — **Info** (bio, email, phone, gender, dob) + **Skills** (view-only `SkillsSection`)
- **Data**: Gọi `GET /users/:id` khi `open=true`, skip khi `userId` null
- **Pattern reuse**: Dùng lại `SkillsSection` với prop `userId` (view-only mode)
- **Visual cue**: Hover tên user → `hover:text-primary hover:underline`; hover avatar → `hover:ring-2 hover:ring-primary/40`

---

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

---

## 📱 Responsive Breakpoints

Dùng Tailwind default breakpoints:
| Breakpoint | Min Width | Usage |
|------------|-----------|---------------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |

### Mobile-first Rules

- Base styles = mobile
- `md:` prefix cho tablet+
- `lg:` prefix cho desktop+

---

## 📋 Component Library

### Reusable Components Location: `src/components/`

| Component       | Location                    | Purpose                                                        |
| --------------- | --------------------------- | -------------------------------------------------------------- |
| UI Components   | `components/ui/`            | shadcn/ui primitives (Button, Input, Label, Card, Sheet, etc.) |
| LoadingSpinner  | `components/common/`        | Full-page or inline loading state                              |
| PasswordInput   | `components/common/`        | Password field with show/hide toggle                           |
| GoogleButton    | `components/common/`        | OAuth button wrapper                                           |
| EmptyState      | `components/common/`        | Empty state với illustration + CTA                             |
| UserProfileCard | `features/user/components/` | Profile display card (Avatar + Info)                           |

### Feature-specific Components Location: `src/features/[feature]/`

| Feature   | Components                                          | Purpose                                            |
| --------- | --------------------------------------------------- | -------------------------------------------------- |
| auth      | LoginPage, RegisterPage, etc.                       | Auth flows                                         |
| user      | UserProfileCard, EditProfilePage, UserProfileDrawer | Profile management + read-only view of other users |
| dashboard | DashboardPage                                       | Home page after login                              |

---

## ✅ Do's and Don'ts

### DO:

- Dùng shadcn/ui components khi có sẵn
- Dùng CSS variables (`bg-primary`, `text-muted-foreground`...) thay vì hardcode color
- Dùng Tailwind utility classes
- Dùng `cn()` utility để merge classes có điều kiện
- Đặt error messages dưới input fields
- Dùng `sonner` toast cho server responses
- Dùng `taskStatusConfig` cho status badge — `taskPriorityConfig` cho priority (tách riêng, không dùng lẫn)
- Dùng Skeleton thay Spinner cho danh sách đang load

### DON'T:

- Hardcode hex colors trong component
- Tạo custom component khi shadcn đã có
- Dùng inline styles
- Mix CSS modules với Tailwind
- Sửa files trong `components/ui/` (auto-generated bởi shadcn)
- Để màn hình trống — luôn dùng `<EmptyState />` khi không có data
- Dùng `taskStatusConfig` để render priority, và ngược lại

---

## 🧠 UX/UI Principles & AI Instructions

### 1. Business Logic & Hierarchy

AI cần tuân thủ thứ tự ưu tiên thị giác cho ứng dụng TaskSense:

**Z-Index System:**

| Level   | Value | Elements                   |
| ------- | ----- | -------------------------- |
| Level 0 | base  | `bg-background`            |
| Level 1 | —     | `bg-card`, Sidebar         |
| Level 2 | z-40  | Header (sticky)            |
| Level 3 | z-50  | Modals, Drawers, Dropdowns |

### 2. Visual Polish & Effects

**Glassmorphism** (Bắt buộc cho Header/Sidebar):

```
bg-background/80 backdrop-blur-md sticky top-0 border-b z-40
```

**Glass Card** (tuỳ chọn cho dashboard widgets):

```
bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm rounded-lg
```

**Elevation (Shadows):**

| State   | Class                                                    |
| ------- | -------------------------------------------------------- |
| Default | `shadow-sm`                                              |
| Hover   | `shadow-md -translate-y-0.5 transition-all duration-200` |
| Active  | `shadow-sm scale-[0.99]`                                 |

### 3. Micro-interactions (Framer Motion)

AI **bắt buộc** dùng các snippet sau khi viết list hoặc page mới:

```tsx
import { motion } from "framer-motion";

// Container — stagger children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

// Item — fade + slide up
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// Usage
<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.li key={item.id} variants={itemVariants}>
      <TaskCard task={item} />
    </motion.li>
  ))}
</motion.ul>

// Button tap feedback
<motion.div whileTap={{ scale: 0.97 }}>
  <Button>Submit</Button>
</motion.div>

// Page / section entrance
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* page content */}
</motion.div>
```

### 4. Empty States

**Không để màn hình trống.** Luôn dùng `<EmptyState />` khi không có data:

```tsx
// Props interface
interface EmptyStateProps {
  icon?: React.ReactNode; // Lucide icon hoặc illustration
  title: string;
  description?: string;
  action?: React.ReactNode; // CTA button
}

// Example usage
<EmptyState
  icon={<ClipboardList className="h-10 w-10 text-muted-foreground" />}
  title="Chưa có task nào"
  description="Tạo task đầu tiên để bắt đầu sprint của bạn."
  action={
    <Button>
      <Plus className="mr-2 h-4 w-4" /> Tạo task
    </Button>
  }
/>;
```

### 5. Skeleton Loading

Dùng `Skeleton` từ shadcn cho **mọi** danh sách đang load. Không dùng spinner cho list:

```tsx
// TaskCard skeleton
function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

// List skeleton
{
  isLoading &&
    Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />);
}
```

### 6. State & Error Mapping (Backend Integration)

**Optimistic UI**: Cập nhật UI ngay lập tức bằng React Query `onMutate` trước khi chờ Backend phản hồi.

**Error Handling** — luôn dùng `getApiErrorMessage` để lấy `message` từ response body của backend.

Backend trả về shape:

```json
{
  "status": 403,
  "message": "You do not have permission to perform this action",
  "timestamp": "..."
}
```

RTK Query parse body này vào `error.data`. Dùng utility sau để extract:

```ts
// src/lib/utils.ts — đã có sẵn
import { getApiErrorMessage } from "@/lib/utils";
```

**Pattern bắt buộc cho mọi catch block**:

```tsx
// ✅ ĐÚNG — hiển thị đúng message từ backend
} catch (err) {
  toast.error(getApiErrorMessage(err, "Fallback message nếu không có message từ BE"));
}

// ❌ SAI — fallback cứng, bỏ qua message từ backend
} catch {
  toast.error("Something went wrong");
}

// ❌ SAI — cast thủ công, không dùng nữa
} catch (err: unknown) {
  const error = err as { data?: { message?: string } };
  toast.error(error?.data?.message ?? "Fallback");
}
```

**Khi cần hiển thị thêm `description`**:

```tsx
} catch (err) {
  toast.error("Failed to update profile", {
    description: getApiErrorMessage(err, "Something went wrong. Please try again."),
  });
}
```

> **Rule**: Không bao giờ dùng `} catch {` (không bind error) cho các mutation call. Luôn bind `(err)` và gọi `getApiErrorMessage(err, fallback)`.

---

> **AI META-RULE**: Luôn ưu tiên tính đơn giản. Nếu giao diện quá rối, hãy đề xuất rút gọn thông tin bằng cách dùng `Tooltip` hoặc `Popover`. Không thêm animation nếu không có trong snippet trên.
