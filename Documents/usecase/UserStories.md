# User Stories & Acceptance Criteria

Tài liệu này chuyển đổi toàn bộ 21 Use Cases từ `UseCases_Detailed_Full.md` thành User Stories theo định dạng chuẩn Agile, bao phủ đầy đủ các tính năng của hệ thống (bao gồm cả AI, Notifications, Attachments).

## Epic 1: Authentication & User Profile

### US-01: Đăng ký & Tạo Workspace (UC-AUTH-01)

**As a** Guest (Người dùng mới),
**I want to** đăng ký tài khoản và tạo luôn một Workspace mặc định,
**So that** tôi có thể bắt đầu sử dụng hệ thống ngay lập tức mà không cần chờ đợi admin phê duyệt.

**Acceptance Criteria:**

- [ ] Form đăng ký yêu cầu: Email, Full Name, Password (min 8 chars), Workspace Name.
- [ ] Email phải là duy nhất trong hệ thống `users`.
- [ ] Sau khi submit thành công, hệ thống tự động đăng nhập.
- [ ] User được chuyển hướng đến Dashboard của Workspace mới tạo.
- [ ] User có role là `OWNER` trong Workspace này.

### US-02: Đăng nhập (UC-AUTH-02)

**As a** Registered User,
**I want to** đăng nhập bằng email và mật khẩu,
**So that** tôi có thể truy cập vào các dự án của mình.

**Acceptance Criteria:**

- [ ] Form đăng nhập yêu cầu: Email, Password.
- [ ] Nếu thông tin sai, hiển thị lỗi chung "Invalid credentials" (bảo mật).
- [ ] Nếu thành công, nhận JWT token và chuyển hướng về trang trước đó hoặc Dashboard.
- [ ] Có chức năng "Remember me".

### US-03: Quên mật khẩu (UC-AUTH-03)

**As a** Guest,
**I want to** khôi phục mật khẩu qua Email,
**So that** tôi có thể truy cập lại tài khoản nếu quên password.

**Acceptance Criteria:**

- [ ] Gửi mã OTP hoặc Link reset về email đã đăng ký.
- [ ] Cho phép nhập mật khẩu mới sau khi verify OTP thành công.
- [ ] Đăng nhập lại bằng mật khẩu mới sau khi đổi.

### US-04: Cập nhật Hồ sơ (UC-AUTH-04)

**As a** User,
**I want to** cập nhật thông tin cá nhân và kỹ năng (Skills),
**So that** đồng nghiệp nhận diện được tôi và AI có thể gợi ý task phù hợp.

**Acceptance Criteria:**

- [ ] Cho phép upload Avatar.
- [ ] Cập nhật Bio và danh sách Skills.

---

## Epic 2: Workspace & Project Management

### US-05: Mời thành viên & Quản lý Team (UC-WS-01, UC-WS-02)

**As a** Workspace Owner/Admin,
**I want to** mời thành viên vào Workspace và tạo các nhóm (Team Template),
**So that** tôi có thể tổ chức nhân sự hiệu quả.

**Acceptance Criteria:**

- [ ] Gửi email invite cho người chưa có tài khoản.
- [ ] Add thẳng người đã có tài khoản vào Workspace.
- [ ] Tạo Team Template (VD: "Frontend Team") gồm nhiều thành viên để dùng lại sau này.

### US-06: Tạo & Cấu hình Project (UC-PROJ-01, UC-PROJ-02)

**As a** Workspace Owner/Admin,
**I want to** tạo một dự án mới và thiết lập thành viên,
**So that** team của tôi có không gian làm việc.

**Acceptance Criteria:**

- [ ] Tạo Project với các thông tin: Tên, Mô tả, Date, Visibility (Private/Public).
- [ ] Import thành viên từ Team Template vào Project.
- [ ] Phân quyền trong Project (Manager/Member/Viewer).

### US-07: Xem Dashboard Project (UC-PROJ-03)

**As a** Project Member,
**I want to** xem tổng quan tiến độ dự án qua các view khác nhau,
**So that** tôi nắm bắt được tình hình công việc.

**Acceptance Criteria:**

- [ ] Hỗ trợ Kanban Board view.
- [ ] Hỗ trợ List View.
- [ ] (Nice-to-have) Gantt Chart hoặc Timeline view.

---

## Epic 3: Task Management (Core)

### US-08: Tạo & Quản lý Task (UC-TASK-01, UC-TASK-02)

**As a** Project Member,
**I want to** tạo task mới và cập nhật chi tiết (Mô tả, Checklist, Due Date),
**So that** công việc được định nghĩa rõ ràng.

**Acceptance Criteria:**

- [ ] Quick Add Task trên cột Kanban.
- [ ] Task Detail hỗ trợ Rich Text Editor.
- [ ] Thêm/sửa/xóa Checklist items trong Task.
- [ ] Auto-save khi chỉnh sửa.

### US-09: Chuyển trạng thái Task (UC-TASK-03)

**As a** Project Member,
**I want to** kéo thả task giữa các cột trạng thái (Todo -> Doing -> Done),
**So that** mọi người nắm được tiến độ.

**Acceptance Criteria:**

- [ ] Kéo thả (Drag & Drop) mượt mà.
- [ ] Cập nhật trạng thái ngay lập tức cho các user khác (Realtime/Optimistic UI).
- [ ] Logic: Vào cột "Done" set ngày hoàn thành.

### US-10: Đính kèm file (UC-TASK-04)

**As a** User,
**I want to** upload tài liệu lên Task,
**So that** mọi người có đủ thông tin để làm việc.

**Acceptance Criteria:**

- [ ] Upload file từ máy tính.
- [ ] Hiển thị danh sách file đính kèm trong Task Detail.
- [ ] Preview ảnh/file nếu hỗ trợ.

### US-11: Thảo luận & Collaboration (UC-TASK-05)

**As a** User,
**I want to** comment và mention (@ten_nshien) trong task,
**So that** trao đổi công việc trực tiếp theo ngữ cảnh.

**Acceptance Criteria:**

- [ ] Comment hỗ trợ text và mention user.
- [ ] Realtime update: Comment mới hiện ngay lập tức.
- [ ] Gửi thông báo cho người được mention.

---

## Epic 4: Performance & Time Tracking

### US-12: Log Time - Chấm công (UC-PERF-01)

**As a** Project Member,
**I want to** bấm giờ (Start/Stop) hoặc nhập tay thời gian làm việc,
**So that** hệ thống ghi nhận công sức của tôi.

**Acceptance Criteria:**

- [ ] Nút Start/Stop Timer trên task.
- [ ] Hiển thị đồng hồ đếm giờ.
- [ ] Form nhập tay (Manual Entry): Ngày, Số giờ.

### US-13: Xem Báo cáo Hiệu suất (UC-PERF-02, UC-PERF-03)

**As a** Member/Manager,
**I want to** xem biểu đồ thời gian làm việc và tỷ lệ hoàn thành task,
**So that** đánh giá được hiệu quả công việc.

**Acceptance Criteria:**

- [ ] **Member View**: Biểu đồ giờ làm việc cá nhân trong tuần, KPI hoàn thành (Done vs Overdue).
- [ ] **Manager View**: Bảng tổng hợp performance của toàn bộ thành viên trong dự án.

---

## Epic 5: AI Features (Smart Assistant)

### US-14: AI Gợi ý Assignee (UC-AI-01)

**As a** Manager,
**I want to** nhờ AI gợi ý người phù hợp nhất cho task dựa trên kỹ năng,
**So that** tôi giao việc chính xác và hiệu quả hơn.

**Acceptance Criteria:**

- [ ] Nút "AI Suggest" tại trường Assignee.
- [ ] AI phân tích Title/Desc của Task vs User Skills.
- [ ] Hiển thị danh sách ứng viên phù hợp kèm lý do (Match score).

### US-15: AI Tóm tắt & Tạo Task (UC-AI-02, UC-AI-03)

**As a** User,
**I want to** AI tóm tắt nội dung task dài hoặc tự tạo task từ mô tả thô,
**So that** tôi tiết kiệm thời gian đọc hiểu và nhập liệu.

**Acceptance Criteria:**

- [ ] Tóm tắt Task: Nút "Summarize" trả về bullet points nội dung chính.
- [ ] Tạo Task: Nhập đoạn văn mô tả dự án -> AI sinh ra danh sách Task draft -> User confirm để tạo.

---

## Epic 6: Notifications

### US-16: Hệ thống Thông báo (UC-NOTI-01)

**As a** User,
**I want to** nhận thông báo khi có việc liên quan,
**So that** tôi không bỏ lỡ thông tin quan trọng.

**Acceptance Criteria:**

- [ ] Badge đỏ trên icon chuông khi có noti mới.
- [ ] Danh sách thông báo (Unread/All).
- [ ] Click vào thông báo chuyển đến đúng Task/Project.
- [ ] Mark as read khi đã xem.
