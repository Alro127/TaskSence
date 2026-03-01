# Functional Requirements (FR) - TaskSense

## 0. Product Scope Summary

- **Target users**: Nhóm nhỏ 5-15 người (startup, nhóm dự án cá nhân/sinh viên).
- **Product model**: Giữ **Workspace layer** để phân tách nhóm làm việc.
- **MVP (Phase 1 - Sprint 1-4)**: Không triển khai AI trực tiếp.
- **Phase 2 (Sprint 5-8)**: Triển khai AI nâng cao và mở rộng analytics.

---

## I. Quản lý tài khoản và người dùng

### 1. Xác thực và bảo mật

- Đăng ký, đăng nhập
- Xác thực email (OTP)
- Quên và đổi mật khẩu
- Đăng xuất

### 2. Hồ sơ cá nhân

- Avatar
- Tên hiển thị
- Email, số điện thoại
- Danh sách kỹ năng (skills)

### 3. Phân quyền (RBAC)

- Vai trò: Workspace Owner, Project Manager, Member, Viewer
- Phân quyền theo phạm vi workspace và project

---

## II. Quản lý Workspace và Project

### 1. Workspace

- Tạo workspace
- Mời và quản lý thành viên
- Phân quyền trong workspace
- Cài đặt chung workspace

### 2. Project

- Tạo, sửa, xóa/archive project
- Mô tả và cấu hình project
- Theo dõi tiến độ tổng thể project

---

## III. Quản lý công việc

### 1. Task và Subtask

- Tạo task và subtask/checklist
- Priority, deadline, tag/label
- Đính kèm file (MVP dùng MinIO)
- Mô tả rich text

### 2. Phân công và workflow

- Assign một hoặc nhiều người
- Theo dõi trạng thái
- Trạng thái cố định: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`

---

## IV. Chế độ xem và theo dõi tiến độ

### 1. Views

- Kanban board
- List view
- Calendar view
- Timeline/Gantt (Phase 2)

### 2. Dashboard và báo cáo (MVP)

- Tiến độ project
- KPI 1: **Task throughput** (done theo ngày/tuần)
- KPI 2: **Overdue trends** (xu hướng task quá hạn)
- Export PDF/Excel

---

## V. Cộng tác và giao tiếp

- Comment trong task
- Mention người dùng
- Đính kèm file
- Lịch sử hoạt động

---

## VI. Search & Analytics với Elasticsearch

### 1. Mục tiêu MVP

- Full-text search + filter + sort cho dữ liệu nghiệp vụ
- Analytics hỗ trợ dashboard với 2 KPI (Task throughput, Overdue trends)

### 2. Phạm vi index MVP

- Task
- Project
- User profile

### 3. Mức độ triển khai MVP

- Search mức **trung bình**: keyword, filter, sort, highlight, typo tolerance
- Ngôn ngữ tìm kiếm: **Tiếng Việt + Tiếng Anh**

### 4. Kiến trúc tích hợp

- Stack: Spring Data Elasticsearch
- Đồng bộ dữ liệu: **Batch theo lịch** từ PostgreSQL sang Elasticsearch
- Reindex: **Manual command**
- Triển khai: **Docker Compose local**

---

## VII. Tính năng AI (Phase 2)

### 1. AI tạo và phân tích công việc

- AI gợi ý assignee phù hợp
- AI sinh subtask từ mô tả tự nhiên

### 2. AI dự đoán và cảnh báo

- Cảnh báo nguy cơ trễ deadline
- Gợi ý ưu tiên xử lý công việc

### 3. AI trợ lý dự án

- Chatbot hỏi đáp tiến độ dự án (RAG)
- Elasticsearch làm retrieval source cho chatbot

---

## VIII. Thông báo và nhắc việc

- In-app notification
- Email notification
- Nhắc deadline
- Cảnh báo khi bị mention
- Daily/weekly digest
- Realtime scope: chỉ realtime cho notification bell (MVP)
