# TaskSense - Design System

> Tất cả component và giao diện mới **PHẢI** tuân thủ theo quy tắc trong file này để đảm bảo sự nhất quán.

---

## 🎨 Color Palette

Ứng dụng dùng custom palette "Academic Atelier" — **không dùng CSS token shadcn mặc định** như `bg-primary`, `bg-muted`, `text-foreground` v.v. Thay vào đó dùng trực tiếp các hex/rgba sau:

### Core Colors

| Role | Hex | Usage | Tailwind Class |
|---|---|---|---|
| Primary Blue | `#233a87` | Buttons, active nav, icons, progress bar | `text-[#233a87]` / `bg-[#233a87]` |
| Text Primary | `#1a1c1b` | Headings, card titles | `text-[#1a1c1b]` |
| Text Secondary | `#444651` | Descriptions, metadata, labels | `text-[#444651]` |
| Background | `#faf9f7` | Page background, empty state bg | `bg-[#faf9f7]` |
| Surface Low | `#f4f3f1` | Sidebar background | `bg-[#f4f3f1]` |
| Surface High | `#e9e8e6` | Hover state bg, count badges | `bg-[#e9e8e6]` |
| Separator | `#efeeec` | Horizontal rules, dividers | `border-[#efeeec]` |
| White | `#ffffff` | Card backgrounds | `bg-white` |
| Teal (Success) | `#006a61` | Completed states, success badges | `text-[#006a61]` |
| Amber (Warning) | `#643300` | On Hold, warning badges | `text-[#643300]` |
| Destructive | `#ba1a1a` | Delete, error badges | `text-[#ba1a1a]` |

### RGBA Overlay System

Dùng pattern nhất quán: màu nền opacity 8%, border opacity 20%:

| Color | Background | Border | Usage |
|---|---|---|---|
| Primary Blue | `rgba(35,58,135,0.08)` | `rgba(35,58,135,0.2)` | Active badge, icon bg |
| Teal | `rgba(0,106,97,0.08)` | `rgba(0,106,97,0.2)` | Completed badge |
| Amber | `rgba(100,51,0,0.08)` | `rgba(100,51,0,0.2)` | On Hold badge |
| Gray | `rgba(68,70,81,0.08)` | `rgba(68,70,81,0.2)` | Archived badge |
| Destructive | `rgba(186,26,26,0.08)` | `rgba(186,26,26,0.2)` | Rejected badge |
| Blue (pinned bg) | `rgba(35,58,135,0.04)` | — | Pinned card bg |
| Blue (icon bg) | `rgba(35,58,135,0.08)` | — | Icon container bg |
| Blue (progress bg) | `rgba(35,58,135,0.1)` | — | Progress bar track |
| Ghost border | `rgba(197,197,211,0.25)` | — | `ghost-border` utility |
| Solid border | `rgba(197,197,211,0.35)` | — | Cards, inputs |
| Dashed border | `rgba(197,197,211,0.5)` | — | Empty state, ghost cards |

### Status Colors: Project

Định nghĩa tập trung trong `STATUS_CONFIG` tại `ProjectCard.tsx`:

```tsx
export const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    icon: Clock,
    badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: Pause,
    badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]",
  },
};
```

### Status Colors: Task

Định nghĩa inline trong `TaskDetailPage.tsx` dưới dạng `STATUS_OPTIONS`. Dùng cùng palette rgba:

```tsx
const STATUS_OPTIONS = [
  { value: "TODO",        label: "Todo",        badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]" },
  { value: "IN_PROGRESS", label: "In Progress", badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]" },
  { value: "REVIEW",      label: "Review",      badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]" },
  { value: "DONE",        label: "Done",        badgeClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]" },
];
```

### Priority Colors: Task

Định nghĩa inline trong `TaskDetailPage.tsx` dưới dạng `PRIORITY_OPTIONS`. Cùng badge pattern (text + bg + border):

```tsx
const PRIORITY_OPTIONS = [
  { value: "LOW",    label: "Low",    badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]" },
  { value: "MEDIUM", label: "Medium", badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]" },
  { value: "HIGH",   label: "High",   badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]" },
  { value: "URGENT", label: "Urgent", badgeClass: "text-[#ba1a1a] bg-[rgba(186,26,26,0.08)] border-[rgba(186,26,26,0.2)]" },
];
```

> **Rule**: Task status và priority dùng cùng badge pattern với project status, không dùng Tailwind utility colors (slate, blue, green...).

---

## 📐 Typography

### Font Families

| Role | Font | Usage |
|---|---|---|
| Headings (page title) | `'Epilogue', 'Inter', sans-serif` | Via inline style |
| Body | `Inter, sans-serif` | Default `font-sans` |

**Pattern cho page title:**
```tsx
<h1
  className="text-3xl font-bold text-[#1a1c1b]"
  style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
>
  Page Title
</h1>
```

### Font Size Scale

| Element | Class | Notes |
|---|---|---|
| Page title | `text-3xl font-bold` | + Epilogue font + `-0.02em` letter-spacing |
| Section title | `text-2xl font-bold` | — |
| Card title | `text-sm font-semibold` | `text-[#1a1c1b]` |
| Body | `text-sm` | — |
| Small / metadata | `text-xs text-[#444651]` | — |
| Section label (eyebrow) | `text-xs font-semibold uppercase tracking-widest text-[#444651]` | Above page titles |
| Section count badge | `text-[10px] font-semibold text-[#444651]` | In section headers |
| Badge text | `text-xs font-medium` | Status/role badges |

---

## 📦 Spacing

| Usage | Class | Value |
|---|---|---|
| Page outer padding | `p-6` | 24px |
| Card inner padding | `p-5` | 20px |
| Card grid gap | `gap-4` | 16px |
| Section spacing | `space-y-8` (major) / `space-y-6` (sub) / `space-y-3` (compact) | — |
| Inline gap | `gap-2` | 8px |
| Icon + text gap | `gap-3` | 12px |
| Tight gap | `gap-1` | 4px |

---

## 🔲 Border Radius

| Element | Class | Pixels |
|---|---|---|
| Card | `rounded-xl` | 12px |
| Button, Input | `rounded-md` | 4px (base) |
| Icon container | `rounded-lg` | 8px |
| Badge / pill | `rounded-full` | — |
| Modal, Drawer | `rounded-lg` | — |

> **Note**: `--radius` CSS variable là `0.25rem` (4px) — crisp/editorial, không phải 8px mặc định shadcn.

---

## 🪟 Shadow System

| State | Class |
|---|---|
| Card default | `shadow-[0_1px_4px_rgba(0,0,0,0.06)]` |
| Card hover | `shadow-[0_2px_8px_rgba(0,0,0,0.09)]` |
| Drawer / elevated | `shadow-[0_1px_32px_rgba(0,0,0,0.10)]` |

**Card hover pattern** (luôn kết hợp shadow + lift):
```
transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px]
```

---

## 🔲 Border System

| Type | Class | Usage |
|---|---|---|
| Ghost border (utility) | `ghost-border` | Cards — `outline: 1px solid rgba(197,197,211,0.25)` |
| Solid thin border | `border border-[rgba(197,197,211,0.35)]` | Inputs, popovers |
| Dashed border | `border border-dashed border-[rgba(197,197,211,0.5)]` | Ghost cards, empty states |
| Left accent (task card) | `border-l-4 border-l-[#233a87]` | In-progress task |
| Status-colored border | `border border-[rgba(35,58,135,0.2)]` | Status badges |

---

## 🃏 Card Patterns

### Workspace / Project Card (Standard)

```tsx
<div className="ghost-border cursor-pointer rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px]">
  {/* Icon container */}
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
    <SomeIcon className="h-5 w-5 text-[#233a87]" />
  </div>
</div>
```

**Pinned variant** — thêm class vào card root:
```
bg-[rgba(35,58,135,0.04)]
```

### Ghost / Quick-Create Card

```tsx
<button className="flex min-h-[130px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-[#444651] transition-all hover:border-[#233a87]/40 hover:bg-[rgba(35,58,135,0.04)] hover:text-[#233a87]">
  <Plus className="h-5 w-5" />
  <span className="text-xs font-medium">New item</span>
</button>
```

### Progress Bar (Project Card)

```tsx
<div className="space-y-1">
  <div className="flex items-center justify-between text-xs text-[#444651]">
    <span>Progress</span>
    <span>{Math.round(progress)}%</span>
  </div>
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(35,58,135,0.1)]">
    <div
      className="h-full rounded-full bg-[#233a87] transition-all"
      style={{ width: `${Math.min(progress, 100)}%` }}
    />
  </div>
</div>
```

---

## 🏷️ Badge Patterns

### Status Badge (Project / Join Request)

```tsx
<span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium {badgeClass}">
  <StatusIcon className="h-3 w-3" />
  {label}
</span>
```

### Section Count Badge

```tsx
<span className="rounded-full bg-[#e9e8e6] px-2 py-0.5 text-[10px] font-semibold text-[#444651] normal-case tracking-normal">
  {count}
</span>
```

---

## 🔘 Button Variants

Dùng shadcn `Button` component. **Không override bằng inline styles** trừ trường hợp cần primary color trực tiếp (`bg-[#233a87] text-white hover:opacity-90`).

```tsx
<Button>Primary (default)</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button variant="link">Link</Button>
```

### Button Sizes

| Size | Class | Height |
|---|---|---|
| Default | `size="default"` | h-9 (36px) |
| Large | `size="lg"` | h-10 (40px) |
| Small | `size="sm"` | h-8 (32px) |
| Extra Small | `size="xs"` | h-6 (24px) |
| Icon (default) | `size="icon"` | 36×36 |
| Icon Large | `size="icon-lg"` | 40×40 |
| Icon Small | `size="icon-sm"` | 32×32 |
| Icon Extra Small | `size="icon-xs"` | 24×24 |

---

## 📝 Form Fields

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter name..." />
  {error && <p className="text-sm text-[#ba1a1a]">{error}</p>}
</div>
```

- **Error**: `border-[#ba1a1a]` + error message below
- **Disabled**: `disabled` attribute (opacity auto)
- **Focus ring**: `focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring` (teal — `#006a61`)

---

## 🏗️ Layout Patterns

### Page Header

```tsx
<div>
  <p className="text-xs font-semibold uppercase tracking-widest text-[#444651] mb-1">
    Section Label
  </p>
  <h1
    className="text-3xl font-bold text-[#1a1c1b]"
    style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
  >
    Page Title
  </h1>
  <p className="text-sm text-[#444651] mt-1">Subtitle / description</p>
</div>
```

### Section Header with Count

```tsx
<h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#444651]">
  Section Name
  <span className="rounded-full bg-[#e9e8e6] px-2 py-0.5 text-[10px] font-semibold text-[#444651] normal-case tracking-normal">
    {count}
  </span>
</h2>
```

### Card Grid

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} ... />)}
</div>
```

### Main App Layout

- Sidebar width: `w-64` (256px), `bg-[#f4f3f1]`
- Active nav item: `border-l-4 border-[#233a87] bg-[#e9e8e6] pl-2 pr-3 text-[#233a87] font-semibold rounded-r-md`
- Inactive nav item: `px-3 rounded-md text-[#444651] hover:bg-[#e9e8e6] hover:text-[#1a1c1b]`
- Header: `flex h-14 shrink-0 items-center justify-between bg-[#faf9f7] px-4 md:px-8`
- Desktop sidebar: `hidden md:flex` (hidden on mobile)
- Mobile: hamburger `<Menu>` icon in header (`md:hidden`), fixed drawer overlay with `backdrop-blur-sm`

### Z-Index System

| Level | Value | Elements |
|---|---|---|
| Level 0 | base | `bg-[#faf9f7]` page background |
| Level 1 | — | `bg-white` cards, `bg-[#f4f3f1]` sidebar |
| Level 2 | z-40 | Header (sticky) |
| Level 3 | z-50 | Modals, Drawers, Dropdowns |

---

## 🎭 Empty States

```tsx
<div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7]">
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)]">
    <SomeIcon className="h-7 w-7 text-[#233a87]" />
  </div>
  <div className="text-center space-y-1">
    <p className="text-sm font-semibold text-[#1a1c1b]">No items yet</p>
    <p className="text-xs text-[#444651]">Description text here</p>
  </div>
  <Button>Create first item</Button>
</div>
```

> **Rule**: Không để màn hình trống. Luôn dùng pattern empty state khi không có data.

---

## ⏳ Skeleton Loading

Dùng `Skeleton` từ shadcn cho **mọi** danh sách đang load. Không dùng spinner cho list:

```tsx
// Card skeleton
function CardSkeleton() {
  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

{isLoading && Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
```

---

## 🔔 Toast / Notification

```tsx
import { toast } from "sonner";

toast.success("Saved successfully!");
toast.error("Failed to save");
toast.info("Invitation sent");
toast.success("Done!", { description: "Your changes have been applied." });
```

---

## ⚙️ Custom Utility Classes (index.css)

| Class | Definition | Usage |
|---|---|---|
| `ghost-border` | `outline: 1px solid rgba(197,197,211,0.25)` | Card subtle border |
| `skeleton` | Shimmer gradient animation | Loading placeholders |
| `hide-scrollbar` | Hides scrollbar cross-browser | Overflow scroll areas |
| `bell-shake` | 0.6s shake keyframe animation | Notification bell |

---

## 🔁 State & Error Handling

### Error Messages from Backend

Backend trả về:
```json
{ "status": 403, "message": "You do not have permission", "timestamp": "..." }
```

**Bắt buộc** dùng `getApiErrorMessage` trong mọi catch block:

```tsx
import { getApiErrorMessage } from "@/lib/utils";

} catch (err) {
  toast.error(getApiErrorMessage(err, "Fallback message"));
}

// Với description
} catch (err) {
  toast.error("Failed to update", {
    description: getApiErrorMessage(err, "Something went wrong. Please try again."),
  });
}
```

> **Rule**: Không bao giờ dùng `} catch {` (không bind error). Luôn bind `(err)` và gọi `getApiErrorMessage`.

### Optimistic UI

Cập nhật UI ngay lập tức bằng React Query `onMutate` trước khi chờ Backend phản hồi.

---

## 🧩 Micro-interactions (Framer Motion)

Dùng khi viết list hoặc page mới:

```tsx
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants}>
      <Card item={item} />
    </motion.li>
  ))}
</motion.ul>

// Page / section entrance
<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
  {/* content */}
</motion.div>

// Button tap feedback
<motion.div whileTap={{ scale: 0.97 }}>
  <Button>Submit</Button>
</motion.div>
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Notes |
|---|---|---|
| `sm` | 640px | 2-column card grid |
| `md` | 768px | Tablets |
| `lg` | 1024px | 3-column card grid |
| `xl` | 1280px | Wide desktop |

Mobile-first: base = mobile, `md:` = tablet+, `lg:` = desktop+.

---

## ✅ Do's and Don'ts

### DO:
- Dùng hardcoded hex values từ palette trên (`#233a87`, `#1a1c1b`, `#444651`, v.v.)
- Dùng `ghost-border` cho card borders thay vì `border border-border`
- Dùng `rounded-xl` cho cards (không phải `rounded-lg`)
- Dùng `p-5` cho card padding (không phải `p-6`)
- Dùng `cn()` để merge classes có điều kiện
- Dùng `STATUS_CONFIG` (ProjectCard) cho project status badges
- Dùng `STATUS_OPTIONS` / `PRIORITY_OPTIONS` (TaskDetailPage) cho task status/priority badges
- Dùng `<div className="h-px bg-[#efeeec]" />` thay vì `<Separator />` (shadcn component)
- Dùng Skeleton thay Spinner cho danh sách đang load
- Dùng `sonner` toast cho server responses
- Dùng `getApiErrorMessage(err, fallback)` trong mọi catch block

### DON'T:
- Dùng CSS token shadcn mặc định (`bg-primary`, `text-muted-foreground`, `bg-background`) thay vì hex cụ thể
- Hardcode hex màu **khác** với palette trên
- Dùng `rounded-lg` cho cards (dùng `rounded-xl`)
- Dùng inline styles ngoại trừ `fontFamily` và `letterSpacing` cho page title
- Sửa files trong `components/ui/` (auto-generated bởi shadcn)
- Để màn hình trống — luôn dùng empty state pattern khi không có data
- Dùng `<Separator />` shadcn — thay bằng `<div className="h-px bg-[#efeeec]" />`
- Dùng `} catch {` không bind error

---

> **AI META-RULE**: Ưu tiên tính đơn giản. Nếu giao diện quá rối, dùng `Tooltip` hoặc `Popover` để ẩn thông tin phụ. Không thêm animation ngoài snippet Framer Motion trên.
