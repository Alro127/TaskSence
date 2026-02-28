# Detailed Use Cases Specification (Full Scope)

Tài liệu này định nghĩa chi tiết toàn bộ 21 Use Case (UC) cho hệ thống, bao phủ đầy đủ các chức năng trong FR.md. Cấu trúc được chuẩn hóa để làm đầu vào cho đội phát triển và kiểm thử.

---

## 1. Authentication & User Profile (Quản lý tài khoản)

### UC-AUTH-01: Đăng ký & Tạo Workspace (Register)

- **Actor**: Guest (Người dùng mới chưa có tài khoản)
- **Trigger**: User truy cập trang chủ và nhấn nút "Đăng ký".
- **Pre-conditions**: User chưa đăng nhập.
- **Post-conditions**:
  - Tài khoản User mới được tạo.
  - Một Workspace mới được tạo.
  - User được gán role `OWNER` của Workspace đó.
  - User được tự động đăng nhập.

**Main Flow:**

1.  User nhấn nút "Đăng ký".
2.  Hệ thống hiển thị form yêu cầu: Email, Full Name, Password, Workspace Name (Tên công ty/nhóm).
3.  User nhập thông tin và nhấn "Submit".
4.  Hệ thống validate:
    - Email hợp lệ và chưa tồn tại.
    - Password đủ độ mạnh (min 8 ký tự).
    - Workspace Name không để trống.
5.  Hệ thống thực hiện transaction tạo dữ liệu: `User` -> `Workspace` -> `WorkspaceMember (Role=OWNER)`.
6.  Hệ thống cấp JWT Token và chuyển hướng User vào Dashboard.

**Alternative Flows:**

- **Email đã tồn tại**: Hệ thống hiển thị lỗi "Email này đã được sử dụng" và gợi ý Đăng nhập.
- **Lỗi hệ thống**: Hiển thị thông báo "Đã có lỗi xảy ra, vui lòng thử lại sau".

### UC-AUTH-02: Đăng nhập (Login)

- **Actor**: Guest
- **Pre-conditions**: Đã có tài khoản.
- **Post-conditions**: User nhận được Access Token để truy cập API.

**Main Flow:**

1.  User truy cập trang Login.
2.  User nhập Email và Password.
3.  Hệ thống kiểm tra thông tin đăng nhập (Verify Password Hash).
4.  Nếu đúng: Hệ thống trả về JWT Token (bao gồm UserID, WorkspaceID mặc định).
5.  User được chuyển hướng vào Dashboard.

**Alternative Flows:**

- **Sai mật khẩu/Email**: Hệ thống báo lỗi chung "Thông tin đăng nhập không chính xác".
- **Tài khoản bị khóa**: Hệ thống báo "Tài khoản của bạn đã bị vô hiệu hóa".

### UC-AUTH-03: Quên mật khẩu (Forgot Password)

- **Actor**: Guest
- **Trigger**: User quên mật khẩu đăng nhập.

**Main Flow:**

1.  User nhấn "Quên mật khẩu" tại màn hình Login.
2.  User nhập Email đã đăng ký.
3.  Hệ thống kiểm tra Email có tồn tại không.
4.  Nếu tồn tại: Hệ thống tạo mã OTP (hoặc Reset Link) và gửi qua Email.
5.  User check mail, lấy OTP và nhập vào màn hình xác thực.
6.  Hệ thống verify OTP.
7.  User nhập Mật khẩu mới (2 lần).
8.  Hệ thống cập nhật mật khẩu mới và yêu cầu user đăng nhập lại.

### UC-AUTH-04: Cập nhật Hồ sơ cá nhân (Update Profile)

- **Actor**: Authenticated User
- **Trigger**: User muốn thay đổi thông tin cá nhân.
- **Post-conditions**: Thông tin `users` và `user_skills` được cập nhật.

**Main Flow:**

1.  User truy cập trang "Profile Settings".
2.  Hệ thống hiển thị thông tin hiện tại (Avatar, Name, Bio, Skills).
3.  User thay đổi thông tin (VD: Upload ảnh mới, thêm Skill "ReactJS").
4.  User nhấn "Save Changes".
5.  Hệ thống validate dữ liệu (Định dạng ảnh, độ dài text).
6.  Hệ thống lưu xuống DB và trả về thông báo thành công.

---

## 2. Workspace Management (Quản lý Workspace)

### UC-WS-01: Mời thành viên vào Workspace

- **Actor**: Workspace Owner / Admin
- **Trigger**: Cần thêm nhân sự vào công ty/tổ chức.
- **Post-conditions**: Email mời được gửi hoặc User được add thẳng vào Workspace.

**Main Flow:**

1.  User vào "Workspace Settings" -> Tab "Members".
2.  User nhấn "Invite Member".
3.  User nhập danh sách Email (có thể nhập nhiều).
4.  User chọn Role mặc định cho họ trong Workspace (thường là `MEMBER`).
5.  Hệ thống kiểm tra từng Email:
    - **Case A (Đã có tk)**: Tạo record `workspace_members`, gửi Notify.
    - **Case B (Chưa có tk)**: Gửi Email Invite chứa link đăng ký đặc biệt.
6.  Hệ thống hiển thị danh sách đã mời thành công.

### UC-WS-02: Quản lý Team Template

- **Actor**: Authenticated User
- **Trigger**: User muốn tạo nhóm mẫu để invite nhanh vào các dự án sau này.
- **Post-conditions**: Record mới trong `team_templates`.

**Main Flow:**

1.  User truy cập menu "My Teams".
2.  User nhấn "Create Team".
3.  User nhập Tên Team (VD: "Mobile Squad") và mô tả.
4.  User thêm thành viên vào Team (Search theo email/tên).
5.  User nhấn "Save".
6.  Hệ thống lưu `team_templates` và `team_member_templates`.

---

## 3. Project Management (Quản lý Dự án)

### UC-PROJ-01: Tạo Project mới

- **Actor**: Workspace Owner / Admin / Member (tùy cấu hình)
- **Post-conditions**: Project mới được tạo, User tạo trở thành Project Manager.

**Main Flow:**

1.  User nhấn "New Project" trên thanh điều hướng.
2.  User nhập: Tên dự án, Key/Mã dự án (nếu có), Mô tả.
3.  User cấu hình:
    - **Access**: Private (chỉ thành viên được mời) hay Public (cả Workspace thấy).
    - **Dates**: Start Date, End Date.
4.  User chọn "Create Project".
5.  Hệ thống tạo Project -> Add User làm Manager -> Chuyển hướng tới trang Project Board.

### UC-PROJ-02: Cấu hình Project & Thành viên

- **Actor**: Project Manager
- **Pre-conditions**: User phải có role `MANAGER` trong Project hoặc `ADMIN` Workspace.

**Main Flow:**

1.  User vào "Project Settings" -> "Members".
2.  User nhấn "Add Member".
3.  Hệ thống cho phép chọn:
    - Từng User lẻ từ Workspace.
    - Hoặc chọn "Import from Team" (sử dụng UC-WS-02).
4.  User chọn Role trong Project cho các thành viên (Manager, Member, Viewer).
5.  User xác nhận "Add".
6.  Hệ thống cập nhật `project_members` và gửi thông báo cho thành viên mới.

### UC-PROJ-03: Xem Dashboard Project

- **Actor**: Member cuả Project
- **Trigger**: User muốn xem tổng quan tiến độ.

**Main Flow:**

1.  User truy cập vào Project.
2.  Hệ thống hiển thị mặc định là "Kanban Board".
3.  User có thể switch view:
    - **List View**: Xem dạng danh sách.
    - **Timeline**: Xem Gantt chart (nếu có data start/due date).
    - **Dashboard**: Xem biểu đồ Burn-down, tỷ lệ hoàn thành.

---

## 4. Task Management (Quản lý Công việc)

### UC-TASK-01: Tạo Task mới

- **Actor**: Member, Manager
- **Pre-conditions**: Project đang Active.

**Main Flow:**

1.  Tại giao diện Board/List, User nhấn "Add Task".
2.  User nhập Title (Bắt buộc).
3.  User nhập các thông tin bổ sung (Optional):
    - Assignees: Chọn người thực hiện (Multi-select).
    - Due Date: Hạn chót.
    - Priority: Low/Medium/High/Urgent.
    - Tags: Gắn nhãn (Bug, Feature...).
4.  User nhấn "Create".
5.  Hệ thống lưu Task và hiển thị ngay trên UI (không cần reload).

### UC-TASK-02: Chỉnh sửa Task & Subtasks

- **Actor**: Member, Manager
- **Trigger**: Cần cập nhật chi tiết công việc.

**Main Flow:**

1.  User click vào Task để mở Task Detail Modal.
2.  User update Description (Rich Text Editor).
3.  User thêm Checklist (Subtasks):
    - Nhập tên checklist item -> Enter.
    - Có thể tick chọn hoàn thành checklist item.
4.  Hệ thống tự động lưu (Auto-save) sau mỗi thay đổi hoặc khi blur input.

### UC-TASK-03: Chuyển trạng thái Task (Kanban Drag-drop)

- **Actor**: Assignee, Manager
- **Trigger**: Tiến độ công việc thay đổi.

**Main Flow:**

1.  Trên Kanban Board, User kéo thẻ Task từ cột A (Todo) sang cột B (In Progress).
2.  Hệ thống kiểm tra quyền hạn (Viewer không được kéo).
3.  Hệ thống cập nhật `status_id` của Task.
4.  **Logic tự động**:
    - Nếu vào "Done": Cập nhật `actual_end_date` = now.
    - Nếu vào "In Progress" từ "Todo": Có thể trigger start timer (UC-PERF-01).

### UC-TASK-04: Đính kèm file (Upload Attachments)

- **Actor**: Member
- **Post-conditions**: File được lưu và link vào Task.

**Main Flow:**

1.  Trong Task Detail, User nhấn icon "Attach".
2.  User chọn file từ máy tính.
3.  Frontend upload file lên Server/Cloud Storage.
4.  Server trả về File URL.
5.  Frontend gọi API attach file vào Task.
6.  Hệ thống hiển thị thumbnail file trong Task.

### UC-TASK-05: Bình luận & Mention (Collaboration)

- **Actor**: Project Member
- **Trigger**: Cần thảo luận, feedback.

**Main Flow:**

1.  User scroll xuống phần Comments.
2.  User nhập nội dung. Có thể gõ "@" để list thành viên và chọn.
3.  User nhấn "Send".
4.  Hệ thống lưu Comment.
5.  Hệ thống bắn Notification cho những người được Mention và Assignee của Task.
6.  Comment mới xuất hiện ngay lập tức (Realtime update nếu có).

---

## 5. Performance & Time Tracking

### UC-PERF-01: Log Time (Chấm công)

- **Actor**: Assignee
- **Trigger**: Bắt đầu làm việc trên 1 task.

**Main Flow (Timer Mode):**

1.  User nhấn nút "Start Timer" (Play icon) trên Task.
2.  Hệ thống ghi nhận thời điểm bắt đầu (`started_at`).
3.  User làm việc.
4.  User nhấn "Stop Timer".
5.  Hệ thống tính `duration` = Now - `started_at` và lưu vào `time_entries`.

**Alternative Flow (Manual Mode):**

1.  User nhấn "Log Work".
2.  User nhập thời gian (VD: "2h 30m") và ngày thực hiện.
3.  Hệ thống quy đổi ra giây và lưu vào `time_entries`.

### UC-PERF-02: Xem Báo cáo Hiệu suất Cá nhân

- **Actor**: Member
- **Trigger**: Muốn kiểm tra KPI bản thân.

**Main Flow:**

1.  User vào trang "My Performance".
2.  Hệ thống hiển thị Dashboard cá nhân:
    - **Workload**: Số task đang giữ, số task quá hạn.
    - **Time Logged**: Biểu đồ cột thời gian làm việc trong 7 ngày qua.
    - **Efficiency**: Tỷ lệ hoàn thành task (Done / Total Assigned).

### UC-PERF-03: Xem Báo cáo Hiệu suất Project

- **Actor**: Project Manager
- **Trigger**: Cần báo cáo tiến độ tuần cho cấp trên.

**Main Flow:**

1.  Manager vào tab "Reports" của Project.
2.  Hệ thống tổng hợp dữ liệu toàn bộ thành viên trong Project.
3.  Hiển thị bảng `Member Performance`:
    - Columns: Name, Tasks Assigned, Tasks Done, Total Time, Overdue Count.
4.  Hiển thị biểu đồ phân bổ Task theo Status và theo Member.

---

## 6. AI Features (Tính năng thông minh)

### UC-AI-01: AI Gợi ý Assignee (Smart Assign)

- **Actor**: Manager/Member
- **Trigger**: Khi đang tạo/edit task và chưa biết giao cho ai.

**Main Flow:**

1.  Tại field Assignee, User nhấn nút "AI Suggest".
2.  Hệ thống gửi `Task Title`, `Description`, `Tags` và `User Profiles (Skills)` lên AI Engine.
3.  AI phân tích độ phù hợp (Matching Score).
4.  Hệ thống hiển thị danh sách User được gợi ý kèm lý do (VD: "Hoang (90% match - Skill ReactJS)").
5.  User click chọn user để assign.

### UC-AI-02: AI Tóm tắt Task (Summarize)

- **Actor**: Member
- **Trigger**: Task có phần mô tả quá dài hoặc luồng comment tranh luận dài.

**Main Flow:**

1.  User nhấn nút "Summarize with AI" trên header Task.
2.  Hệ thống gửi toàn bộ text (Description + History Comments) lên AI.
3.  AI xử lý và trả về đoạn text ngắn gọn (Bullet points).
4.  Hệ thống hiển thị Popup tóm tắt cho User đọc nhanh.

### UC-AI-03: AI Tạo Task từ Mô tả Natural Language

- **Actor**: Manager
- **Trigger**: Có ý tưởng dự án nhưng lười tạo từng task thủ công.

**Main Flow:**

1.  Manager nhấn "AI Task Generator".
2.  User nhập mô tả tự nhiên: "Setup dự án ReactJS, cài Tailwind, cấu hình Router và trang Login".
3.  AI phân tích và trả về danh sách Preview các Task:
    - [ ] Init React App (FE)
    - [ ] Install TailwindCSS (FE)
    - [ ] Setup React Router (FE)
    - [ ] Create Login UI (FE)
4.  User có thể bỏ chọn các task không muốn.
5.  User nhấn "Create Selected Tasks".
6.  Hệ thống tạo hàng loạt Task vào Project.

---

## 7. Notifications (Hệ thống thông báo)

### UC-NOTI-01: Nhận và Xem Thông báo

- **Actor**: User
- **Trigger**: Có sự kiện liên quan (Assign, Mention, Due Date).

**Main Flow:**

1.  Sự kiện xảy ra (VD: A comment vào task của B).
2.  Hệ thống tạo record `notification` cho B.
3.  UI của B hiện badge đỏ trên icon Chuông.
4.  B click vào icon Chuông.
5.  Hệ thống hiện danh sách thông báo mới nhất.
6.  B click vào thông báo -> Hệ thống đánh dấu "Đã đọc" và chuyển hướng B đến Task đó.
