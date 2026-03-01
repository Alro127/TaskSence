# User Stories & Acceptance Criteria (Aligned Scope)

## Epic 1: Authentication & Profile (MVP)

### US-01: Register/Login/Reset

**As a** user, **I want** đăng ký/đăng nhập/khôi phục mật khẩu, **so that** tôi có thể truy cập hệ thống an toàn.

**Acceptance Criteria**

- [ ] OTP email verification hoạt động.
- [ ] Login trả JWT và redirect đúng.
- [ ] Reset password flow hoàn chỉnh.

### US-02: Profile Update

**As a** user, **I want** cập nhật hồ sơ và skills, **so that** thông tin cá nhân luôn chính xác.

**Acceptance Criteria**

- [ ] Cho phép cập nhật avatar, bio, skills.
- [ ] Validate dữ liệu đầu vào.

---

## Epic 2: Workspace & Project (MVP)

### US-03: Workspace Management

**As a** workspace owner/admin, **I want** tạo workspace và mời thành viên, **so that** team có không gian làm việc chung.

**Acceptance Criteria**

- [ ] Tạo workspace thành công.
- [ ] Invite member theo role.

### US-04: Project Setup

**As a** manager, **I want** tạo project và cấu hình member/role, **so that** có thể bắt đầu quản lý công việc.

**Acceptance Criteria**

- [ ] Tạo project với các trường cơ bản.
- [ ] Quản lý project members theo role.

---

## Epic 3: Task Management & Collaboration (MVP)

### US-05: Task CRUD + Fixed Workflow

**As a** member, **I want** tạo và cập nhật task, **so that** công việc được quản lý rõ ràng.

**Acceptance Criteria**

- [ ] Task có title, desc, priority, due date, assignees.
- [ ] Status cố định: TODO, IN_PROGRESS, REVIEW, DONE.

### US-06: Kanban Drag & Drop

**As a** member, **I want** kéo thả task giữa các cột, **so that** tiến độ được cập nhật trực quan.

**Acceptance Criteria**

- [ ] Drag-drop mượt.
- [ ] Cập nhật trạng thái chính xác sau khi thả.

### US-07: Checklist/Subtasks

**As a** member, **I want** quản lý checklist trong task, **so that** task lớn được chia nhỏ dễ theo dõi.

**Acceptance Criteria**

- [ ] Thêm/sửa/xóa checklist item.
- [ ] Auto-save khi chỉnh sửa.

### US-08: Comments + Mentions

**As a** member, **I want** bình luận và mention trong task, **so that** trao đổi diễn ra đúng ngữ cảnh.

**Acceptance Criteria**

- [ ] Comment text hoạt động ổn định.
- [ ] Mention tạo notification cho user được nhắc.

### US-09: Attachments via MinIO

**As a** member, **I want** tải file đính kèm lên task, **so that** thông tin liên quan được tập trung.

**Acceptance Criteria**

- [ ] Upload file qua MinIO local (MVP).
- [ ] Danh sách attachment hiển thị đúng trên task.

---

## Epic 4: Search & Analytics with Elasticsearch (MVP)

### US-10: Full-text Search

**As a** user, **I want** tìm kiếm task/project/user nhanh, **so that** truy xuất thông tin hiệu quả.

**Acceptance Criteria**

- [ ] Search trên Task/Project/User.
- [ ] Có filter, sort, highlight.
- [ ] Hỗ trợ tiếng Việt + tiếng Anh.

### US-11: KPI Dashboard - Throughput

**As a** manager, **I want** xem throughput theo thời gian, **so that** theo dõi tốc độ hoàn thành.

**Acceptance Criteria**

- [ ] Chart done task theo ngày/tuần.
- [ ] Dữ liệu lấy từ analytics pipeline.

### US-12: KPI Dashboard - Overdue Trends

**As a** manager, **I want** xem xu hướng task trễ hạn, **so that** phát hiện rủi ro sớm.

**Acceptance Criteria**

- [ ] Chart overdue trends theo timeline.
- [ ] Truy vấn ổn định và nhất quán dữ liệu.

### US-13: Batch Sync + Manual Reindex

**As a** admin/system owner, **I want** dữ liệu được sync định kỳ sang Elasticsearch, **so that** search và analytics luôn khả dụng.

**Acceptance Criteria**

- [ ] Batch sync theo lịch hoạt động.
- [ ] Có lệnh manual reindex.

---

## Epic 5: Notifications (MVP)

### US-14: Notification Bell

**As a** user, **I want** nhận thông báo trên icon chuông, **so that** không bỏ lỡ update quan trọng.

**Acceptance Criteria**

- [ ] Badge hiển thị unread count.
- [ ] Click noti điều hướng đúng task/project.
- [ ] MVP realtime ưu tiên cho notification bell.

---

## Epic 6: AI Features (Phase 2)

### US-15: AI Smart Assign

**As a** manager, **I want** AI gợi ý assignee phù hợp, **so that** giao việc hiệu quả hơn.

### US-16: AI Auto Subtask Generation

**As a** user, **I want** AI sinh subtasks từ mô tả, **so that** tiết kiệm thời gian chia việc.

### US-17: AI Chatbot RAG

**As a** user, **I want** chatbot trả lời câu hỏi dự án, **so that** nắm tình hình nhanh.

### US-18: AI Performance Evaluation

**As a** manager, **I want** AI đánh giá hiệu suất từ activity signals, **so that** có góc nhìn khách quan hơn.
