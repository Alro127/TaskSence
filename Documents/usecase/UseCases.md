# Detailed Use Cases Specification (Aligned Scope)

Tài liệu này mô tả các use case đã được đồng bộ theo phạm vi mới:

- **MVP (Phase 1)**: không triển khai AI trực tiếp
- **Phase 2**: triển khai AI nâng cao
- **Performance**: không dùng manual timer/time logging
- **Elasticsearch**: dùng cho search + analytics trong MVP

---

## 1. Authentication & User Profile

### UC-AUTH-01: Đăng ký tài khoản

- **Actor**: Guest
- **Main Flow**:

1. User nhập email/password.
2. Hệ thống gửi OTP xác thực email.
3. User xác thực OTP.
4. Hệ thống tạo tài khoản và profile mặc định.

### UC-AUTH-02: Đăng nhập

- **Actor**: Guest
- **Main Flow**:

1. User nhập email/password.
2. Hệ thống xác thực và cấp JWT.
3. User vào dashboard.

### UC-AUTH-03: Quên mật khẩu

- **Actor**: Guest
- **Main Flow**:

1. User nhập email.
2. Hệ thống gửi reset OTP/link.
3. User đặt mật khẩu mới.

### UC-AUTH-04: Cập nhật hồ sơ

- **Actor**: Authenticated User
- **Main Flow**:

1. User chỉnh avatar, tên, bio, skills.
2. Hệ thống validate và lưu.

---

## 2. Workspace & Project Management

### UC-WS-01: Tạo workspace

- **Actor**: Authenticated User
- **Main Flow**:

1. User tạo workspace mới.
2. Hệ thống gán quyền owner cho user tạo.

### UC-WS-02: Mời thành viên vào workspace

- **Actor**: Workspace Owner/Admin
- **Main Flow**:

1. Nhập email và role.
2. Hệ thống thêm member hoặc gửi lời mời.

### UC-PROJ-01: Tạo project

- **Actor**: Workspace Owner/Admin/Manager
- **Main Flow**:

1. Nhập thông tin project.
2. Chọn member và role.
3. Hệ thống tạo project và mapping thành viên.

### UC-PROJ-02: Cập nhật project settings

- **Actor**: Project Manager
- **Main Flow**:

1. Sửa thông tin project.
2. Điều chỉnh membership/permissions theo role.

---

## 3. Task Management (MVP Core)

### UC-TASK-01: Tạo task

- **Actor**: Member/Manager
- **Main Flow**:

1. Nhập title, description, priority, due date.
2. Chọn assignee (1 hoặc nhiều).
3. Hệ thống lưu task.

### UC-TASK-02: Quản lý subtask/checklist

- **Actor**: Member/Manager
- **Main Flow**:

1. Mở task detail.
2. Thêm/sửa/xóa checklist items.
3. Hệ thống auto-save.

### UC-TASK-03: Chuyển trạng thái task

- **Actor**: Assignee/Manager
- **Main Flow**:

1. Kéo thả task trên Kanban.
2. Hệ thống cập nhật status.
3. Status dùng cố định: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.

### UC-TASK-04: Đính kèm file

- **Actor**: Member
- **Main Flow**:

1. Upload file từ task detail.
2. Backend lưu qua MinIO (MVP).
3. Hệ thống liên kết file với task.

### UC-TASK-05: Bình luận và mention

- **Actor**: Project Member
- **Main Flow**:

1. Gửi comment trong task.
2. Mention thành viên bằng @.
3. Hệ thống tạo notification cho người liên quan.

---

## 4. Search & Analytics (Elasticsearch - MVP)

### UC-SEA-01: Tìm kiếm full-text

- **Actor**: Authenticated User
- **Main Flow**:

1. User nhập keyword.
2. Hệ thống tìm trên Task/Project/User profile.
3. Trả kết quả với filter/sort/highlight.

### UC-SEA-02: Dashboard KPI - Task Throughput

- **Actor**: Project Member/Manager
- **Main Flow**:

1. User mở dashboard.
2. Hệ thống truy vấn index analytics.
3. Hiển thị số task done theo ngày/tuần.

### UC-SEA-03: Dashboard KPI - Overdue Trends

- **Actor**: Project Member/Manager
- **Main Flow**:

1. User mở dashboard.
2. Hệ thống tính xu hướng task quá hạn theo thời gian.
3. Hiển thị chart xu hướng.

### UC-SEA-04: Đồng bộ dữ liệu sang Elasticsearch

- **Actor**: System Scheduler/Admin
- **Main Flow**:

1. Batch job chạy theo lịch.
2. Đồng bộ dữ liệu từ PostgreSQL sang Elasticsearch.
3. Admin có thể chạy manual reindex command khi cần.

---

## 5. Notifications

### UC-NOTI-01: Nhận và xem thông báo

- **Actor**: User
- **Main Flow**:

1. Sự kiện xảy ra (mention/assign/update liên quan).
2. Hệ thống tạo notification.
3. UI hiển thị badge trên chuông.
4. User mở danh sách và điều hướng tới task/project.

> MVP realtime scope: ưu tiên realtime cho notification bell.

---

## 6. AI Features (Phase 2)

### UC-AI-01: AI Smart Assign

- **Actor**: Manager
- **Main Flow**:

1. User chọn AI suggest tại assignee field.
2. AI trả danh sách ứng viên phù hợp.
3. User chọn và xác nhận.

### UC-AI-02: AI Auto Subtask Generation

- **Actor**: Manager/Member
- **Main Flow**:

1. User nhập mô tả task lớn.
2. AI sinh danh sách subtasks.
3. User duyệt và tạo checklist/subtasks.

### UC-AI-03: AI Chatbot RAG

- **Actor**: Authenticated User
- **Main Flow**:

1. User đặt câu hỏi về tiến độ dự án.
2. Chatbot truy vấn retrieval từ Elasticsearch.
3. LLM tổng hợp câu trả lời và trả kết quả.

### UC-AI-04: AI Performance Evaluation

- **Actor**: Manager
- **Main Flow**:

1. Hệ thống thu thập activity signals.
2. AI phân tích xu hướng hiệu suất.
3. Trả báo cáo đánh giá và cảnh báo rủi ro.
