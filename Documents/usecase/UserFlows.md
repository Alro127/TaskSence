# User Flows & Use Cases

Tài liệu này mô tả các luồng người dùng (User Flows) và các trường hợp sử dụng (Use Cases) chính của hệ thống, dựa trên định hướng phát triển phần mềm quản lý công việc và đánh giá hiệu suất.

## 1. Actors (Tác nhân)

Hệ thống được thiết kế cho mô hình Single Instance (Enterprise), với các nhóm người dùng chính sau:

| Actor               | Mô tả                             | Quyền hạn chính                                                                             |
| :------------------ | :-------------------------------- | :------------------------------------------------------------------------------------------ |
| **Workspace Owner** | Người sở hữu không gian làm việc. | Toàn quyền quản lý Workspace, cấu hình hệ thống, quản lý người dùng cấp cao nhất.           |
| **Project Manager** | Quản lý dự án.                    | Tạo/Sửa/Xóa project, phân quyền thành viên trong project, theo dõi tiến độ, quản lý task.   |
| **Member**          | Thành viên thông thường.          | Thực hiện task được giao, tạo task (nếu được phép), cập nhật trạng thái, comment, log work. |
| **Viewer**          | Người xem (Khách/Stakeholder).    | Chỉ xem thông tin project/task, không có quyền chỉnh sửa.                                   |
| **AI Assistant**    | Hệ thống AI.                      | Hỗ trợ tạo task, tóm tắt, gợi ý, cảnh báo rủi ro.                                           |

---

## 2. Core User Flows (Luồng người dùng cốt lõi)

### 2.1. Authentication & Onboarding

Luồng đăng ký, đăng nhập và thiết lập hồ sơ ban đầu.

```mermaid
sequenceDiagram
    participant User
    participant System
    participant EmailService

    User->>System: Yêu cầu Đăng ký (Email, Password)
    System->>EmailService: Gửi mã xác thực (OTP/Link)
    EmailService-->>User: Nhận mã xác thực
    User->>System: Nhập mã xác thực
    System->>System: Tạo tài khoản & Profile mặc định
    System-->>User: Đăng ký thành công -> Chuyển đến trang Login

    User->>System: Đăng nhập (Email, Password)
    alt Thông tin đúng
        System-->>User: Cấp Token (JWT) -> Chuyển đến Dashboard
    else Thông tin sai
        System-->>User: Báo lỗi
    end

    opt Thiết lập Profile (Lần đầu)
        User->>System: Cập nhật Avatar, Tên hiển thị, Skill
        System->>System: Lưu thông tin Profile
    end
```

### 2.2. Project & Workspace Management

Luồng tạo mới không gian làm việc và dự án.

```mermaid
flowchart TD
    start([Bắt đầu]) --> checkRole{Là Owner/Manager?}
    checkRole -- No --> noPerm([Không có quyền])
    checkRole -- Yes --> createProj[Chọn Tạo Project Mới]

    createProj --> inputInfo[Nhập thông tin Project: \n Tên, Mô tả, Deadline]
    inputInfo --> settings[Cấu hình phân quyền & Workflow]
    settings --> addMember[Mời thành viên & Gán vai trò]

    addMember --> confirm[Xác nhận tạo]
    confirm --> sysCreate[Hệ thống khởi tạo Project]
    sysCreate --> notify[Gửi thông báo cho thành viên]
    notify --> endNode([Kết thúc])
```

### 2.3. Task Management Lifecycle

Vòng đời của một công việc từ khi tạo đến khi hoàn thành.

```mermaid
stateDiagram-v2
    [*] --> Todo: Tạo Task
    Todo --> InProgress: Member bắt đầu làm
    InProgress --> Review: Hoàn thành & Yêu cầu review
    Review --> Done: Manager duyệt OK
    Review --> InProgress: Manager từ chối (Yêu cầu sửa lại)
    Done --> [*]

    state InProgress {
        [*] --> Working
        Working --> Blocked: Gặp vấn đề
        Blocked --> Working: Giải quyết xong
    }

    note right of Review: Có thể yêu cầu checklist hoàn tất \n trước khi chuyển sang Done
```

### 2.4. AI-Assisted Task Creation

Luồng sử dụng AI để phân tích yêu cầu từ ngôn ngữ tự nhiên thành các task cụ thể.

```mermaid
sequenceDiagram
    participant PM as Project Manager
    participant UI as Giao diện
    participant AI as AI Engine
    participant DB as Database

    PM->>UI: Nhập mô tả tính năng/yêu cầu \n (VD: "Làm trang Landing Page có form đăng ký")
    UI->>AI: Gửi Prompt: "Phân tích yêu cầu và suggest Tasks"

    loop Xử lý AI
        AI->>AI: Phân tích ngữ nghĩa
        AI->>AI: Chia nhỏ thành Subtasks (Design, FE, BE)
        AI->>AI: Ước lượng Priority & Deadline
    end

    AI-->>UI: Trả về danh sách Task đề xuất (JSON)
    UI->>PM: Hiển thị danh sách Task (Cho phép sửa đổi)

    PM->>UI: Chỉnh sửa & Xác nhận
    UI->>DB: Lưu các Task mới vào Project
    DB-->>UI: Thành công
    UI-->>PM: Hiển thị Task trên Board
```

---

## 3. Detailed Use Cases List

### 3.1. Quản lý Tài khoản (Auth)

- **UC01 - Đăng ký/Đăng nhập**: Người dùng truy cập hệ thống bằng email/password hoặc SSO.
- **UC02 - Quên mật khẩu**: Khôi phục quyền truy cập qua email.
- **UC03 - Cập nhật hồ sơ**: User cập nhật avatar, skill set (phục vụ việc AI gợi ý người làm).

### 3.2. Quản lý Workspace & Project

- **UC04 - Tạo Workspace**: Khởi tạo không gian làm việc chung (thường cho Admin cài đặt lần đầu).
- **UC05 - Quản lý thành viên**: Mời người dùng vào Workspace, phân quyền (Role-based).
- **UC06 - Tạo Project**: Thiết lập dự án mới, config workflow (Status, Label).
- **UC07 - Dashboard tổng quan**: Xem tiến độ dự án qua các biểu đồ (Burndown chart, Task distribution).

### 3.3. Quản lý Task (Công việc)

- **UC08 - Tạo Task thủ công**: Nhập tiêu đề, mô tả rich text, assign, due date.
- **UC09 - Cập nhật trạng thái**: Kéo thả task trên Kanban hoặc đổi status trong Detail view.
- **UC10 - Log Work**: Ghi nhận thời gian làm việc (Time tracking) -> _Dữ liệu đầu vào cho đánh giá hiệu suất_.
- **UC11 - Bình luận & Đính kèm**: Trao đổi trực tiếp trên task, upload tài liệu liên quan.

### 3.4. Tính năng AI

- **UC12 - AI Generate Tasks**: Tạo nhanh danh sách công việc từ mô tả vắn tắt.
- **UC13 - AI Summarize**: Tóm tắt nội dung thảo luận dài trong task comment.
- **UC14 - AI Warning**: Cảnh báo task có nguy cơ trễ hạn dựa trên tiến độ và lịch sử.

### 3.5. Chế độ xem (Views)

- **UC15 - Kanban View**: Xem task dạng thẻ theo cột trạng thái.
- **UC16 - Calendar View**: Xem task theo lịch (deadline, timeline).
- **UC17 - Gantt/Timeline View**: Xem sự phụ thuộc và lộ trình dự án.
