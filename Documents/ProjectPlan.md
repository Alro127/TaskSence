# Project Plan: Task Management & Performance Evaluation System (Enhanced Scope)

> **Thông tin tổng quan**
>
> | Danh mục                | Chi tiết                                                                   |
> | :---------------------- | :------------------------------------------------------------------------- |
> | **Thời gian thực hiện** | **15 Tuần** (27/02/2026 - 29/06/2026)                                      |
> | **Deadline Bảo vệ**     | 29/06/2026                                                                 |
> | **Nhân sự**             | 2 Dev (52 giờ/tuần tương đương 0.65 FTE/người)                             |
> | **Công nghệ**           | **Java (Spring Boot)** + **ReactJS** + **PostgreSQL** + **AI Integration** |
> | **Buffer Time**         | 2 Tuần dự phòng rủi ro                                                     |

---

## I. Work Breakdown Structure (WBS) - Expanded Scope

Với quỹ thời gian 15 tuần, scope dự án được mở rộng thêm phân hệ **Advanced AI Assistant** và **Notification System** hoàn chỉnh hơn.

### Phase 1: Foundation (Tuần 1-3)

**Target**: Hoàn thiện Kiến trúc + Auth + Quản lý Workspace.

- **1.1. System Design & Setup**:
  - Database Schema (Finalize with advanced fields).
  - CI/CD Setup (GitHub Actions cơ bản để auto-build).
  - Backend Skeleton (Security, Exception Handling, Logging).
  - Frontend Skeleton (Theme, Layout, Common Components).
- **1.2. Authentication Module**:
  - Register, Login, Refresh Token (Security chuẩn).
  - Email Verification (gửi mail thật).
- **1.3. Workspace & User Management**:
  - Workspace settings.
  - Member Invite (Email service integration).

### Phase 2: Project Management Core (Tuần 4-7)

**Target**: Hoàn thiện tính năng quản lý dự án cơ bản.

- **2.1. Project & Teams**:
  - Create Project, Project Settings.
  - Team Templates (Quản lý nhóm mẫu).
- **2.2. Task Management**:
  - CRUD Task đầy đủ (Priority, Due date, Labels).
  - Subtasks/Checklists control.
- **2.3. Kanban Board**:
  - Drag and Drop status update.
  - Filter tasks by Assignee/Label.

### Phase 3: Collaboration & Performance (Tuần 8-10)

**Target**: Tính năng cộng tác & Báo cáo.

- **3.1. Rich Communication**:
  - Comments with Mentions (@user).
  - Validation Realtime (WebSocket).
  - File Attachments (AWS S3/Cloudinary).
- **3.2. Performance Tracking**:
  - Time Logging System (Manual + Timer).
  - Personal & Project Dashboard (ChartJS/Recharts).
  - Report Export (PDF/Excel - _feature mới_).

### Phase 4: AI Enhanced Features (Tuần 11-13)

**Target**: Triển khai các tính năng AI thông minh (Mở rộng Scope).

- **4.1. AI Task Assistant**:
  - **Auto-Schedule**: Gợi ý lịch làm việc dựa trên deadline task.
  - **Prioritize Suggestion**: Gợi ý mức độ ưu tiên dựa trên deadline.
- **4.2. Chatbot Assistant (New)**:
  - Chatbox hỏi đáp về dự án: "Tiến độ dự án A thế nào?", "Ai đang rảnh?".
  - Integration with LLM (OpenAI/Gemini/Local LLM).
- **4.3. Content Generation**:
  - Summarize Task/Discussion.
  - Auto-generate Subtasks from Description.

### Phase 5: Stabilization & Delivery (Tuần 14-15)

**Target**: Ổn định hệ thống và chuẩn bị bảo vệ.

- **5.1. Buffer Week (Tuần 14)**:
  - Dành trọn vẹn để fix bug phát sinh từ các Phase trước.
  - Performance Tuning (Index DB, Cache).
- **5.2. Final Delivery (Tuần 15)**:
  - User Acceptance Testing (UAT).
  - Final Presentation & Demo Script.
  - Deploy Production.

---

## II. Product Backlog (Sprint-Mapped)

Danh sách các User Stories (US) được chia nhỏ và map trực tiếp vào từng Sprint để dễ dàng tracking.

#### Sprint 1: Foundation & Auth (Tuần 1-2)

| ID        | Name                |   Type    | Description                                                       | Priority | Points |
| :-------- | :------------------ | :-------: | :---------------------------------------------------------------- | :------: | :----: |
| **US-01** | **System Setup**    | Tech Task | Init Spring Boot & ReactJS structure, Config Database connection. |   High   |   3    |
| **US-02** | **Register**        |  Feature  | User đăng ký tài khoản mới qua Email/Password, xác thực email.    |   High   |   5    |
| **US-03** | **Login**           |  Feature  | User đăng nhập an toàn, server trả về JWT Access & Refresh Token. |   High   |   5    |
| **US-04** | **Forgot Password** |  Feature  | User yêu cầu reset mật khẩu qua email khi quên pass.              |  Medium  |   3    |

#### Sprint 2: Workspace & Project (Tuần 3-4)

| ID        | Name               |  Type   | Description                                                      | Priority | Points |
| :-------- | :----------------- | :-----: | :--------------------------------------------------------------- | :------: | :----: |
| **US-05** | **Workspace CRUD** | Feature | User tạo, đổi tên, và xóa Workspace (không gian làm việc chung). |   High   |   3    |
| **US-06** | **Invite Member**  | Feature | Workspace Owner mời thành viên khác vào thông qua email.         |   High   |   5    |
| **US-07** | **Project CRUD**   | Feature | Tạo project mới bên trong Workspace, cấu hình thông tin cơ bản.  |   High   |   3    |
| **US-08** | **Permission**     | Feature | Phân quyền: Chỉ Owner/Admin mới được chỉnh sửa Setting Project.  |  Medium  |   3    |

#### Sprint 3: Task & Kanban (Tuần 5-6)

| ID        | Name                 |  Type   | Description                                                              | Priority | Points |
| :-------- | :------------------- | :-----: | :----------------------------------------------------------------------- | :------: | :----: |
| **US-09** | **Task CRUD**        | Feature | Tạo, sửa, xóa task với các trường: Title, Desc, Priority, Expected Time. |   High   |   8    |
| **US-10** | **Task Assign**      | Feature | Gán thành viên chịu trách nhiệm (Assignee) cho task.                     |   High   |   3    |
| **US-11** | **Kanban Interface** |  UI/UX  | Hiển thị bảng Kanban với các cột Dynamic (Todo, In Progress, Done).      |   High   |   8    |
| **US-12** | **Drag & Drop**      | Feature | Kéo thả task giữa các cột để cập nhật trạng thái nhanh.                  |   High   |   5    |

#### Sprint 4: Collaboration (Tuần 7-8)

| ID        | Name               |  Type   | Description                                                      | Priority | Points |
| :-------- | :----------------- | :-----: | :--------------------------------------------------------------- | :------: | :----: |
| **US-13** | **Comment System** | Feature | User thảo luận, trao đổi trực tiếp ngay trong Task Detail modal. |  Medium  |   5    |
| **US-14** | **Attachments**    | Feature | Upload và đính kèm file (ảnh, doc) vào task hoặc comment.        |  Medium  |   5    |
| **US-15** | **Realtime Noti**  | Feature | Nhận thông báo (bell notification) tức thì khi có hoạt động mới. |  Medium  |   5    |
| **US-16** | **Mention**        | Feature | Tag tên thành viên (@username) trong comment để gây sự chú ý.    |   Low    |   3    |

#### Sprint 5: Reporting (Tuần 9-10)

| ID        | Name              |  Type   | Description                                                            | Priority | Points |
| :-------- | :---------------- | :-----: | :--------------------------------------------------------------------- | :------: | :----: |
| **US-17** | **Time Timer**    | Feature | Bấm giờ Start/Stop trực tiếp trên task để đo lường thời gian làm việc. |  Medium  |   5    |
| **US-18** | **Project Stats** | Feature | Xem biểu đồ tổng quan tiến độ dự án (Pie Chart, Burn-down chart).      |  Medium  |   8    |
| **US-19** | **My Dashboard**  | Feature | Dashboard cá nhân hiển thị: Task của tôi, Task quá hạn, Hiệu suất.     |   Low    |   5    |
| **US-20** | **Export Excel**  | Feature | Xuất danh sách task và báo cáo chấm công ra file Excel/PDF.            |   Low    |   3    |

#### Sprint 6: AI Features (Advanced) (Tuần 11-12)

| ID        | Name                |  Type  | Description                                                   | Priority | Points |
| :-------- | :------------------ | :----: | :------------------------------------------------------------ | :------: | :----: |
| **US-21** | **AI Suggestion**   |   AI   | Gợi ý Assignee phù hợp dựa trên kỹ năng và lịch sử làm việc.  |   Low    |   5    |
| **US-22** | **Auto-Schedule**   |   AI   | Gợi ý sắp xếp thứ tự thực hiện task để tối ưu thời gian.      |   Low    |   8    |
| **US-23** | **Project Chatbot** | AI/RAG | Chatbot trả lời câu hỏi về dự án dựa trên dữ liệu thật (RAG). |   Low    |   13   |
| **US-24** | **Summarization**   |   AI   | Tóm tắt nội dung thảo luận dài trong task thành action items. |   Low    |   3    |

---

## III. Detailed 15-Week Timeline (Sprint Plan)

_Mô hình: 2 tuần/Sprint (Sprint cuối 1 tuần)_.
_Capacity: 2 người x 26h = 52h/tuần ~ 100h/Sprint._

### SPRINT 1: Foundation & Authentication (Tuần 1-2)

**Goal**: Xây dựng xong nền móng dự án và luồng đăng nhập/đăng ký hoàn chỉnh.
**Focus**: System Setup, Database, Auth Module.

#### 1. Tasks Breakdown

- **Backend (Dev A)**:
  - [ ] Init Spring Boot Project (Dependency: Security, JPA, Lombok, JWT).
  - [ ] Setup PostgreSQL & Flyway/Liquibase Migration (Create `users`, `roles`, `workspaces` tables).
  - [ ] Implement `AuthProvider`: Login, Register, Refresh Token logic.
  - [ ] Setup Global Exception Handler & API Response Wrapper.
- **Frontend (Dev B)**:
  - [ ] Init React + Vite + TailwindCSS.
  - [ ] Setup Redux Toolkit (Auth Slice) & Axios Interceptors.
  - [ ] Create UI: Login Page, Register Page, Forgot Password Page.
  - [ ] Create Sidebar/Layout component (Responsive basics).

#### 2. Definition of Done (DoD)

- [ ] Database đã chạy trên local/docker.
- [ ] API Login trả về JWT Token hợp lệ.
- [ ] User đăng ký xong tự động redirect vào Dashboard.
- [ ] Không hard-code credentials trong code.

#### 3. Deliverables

- Database ERD Diagram (Final).
- Source Code v0.1 (Login/Register working).
- API Docs (Swagger UI) cho Auth module.

---

### SPRINT 2: Core Workspace & Project Structure (Tuần 3-4)

**Goal**: User có thể tạo không gian làm việc và dự án để bắt đầu quản lý.
**Focus**: CRUD Operations cứng.

#### 1. Tasks Breakdown

- **Backend (Dev A)**:
  - [ ] API CRUD `Workspace` (Create, Edit name).
  - [ ] API Invite Member (Add email to `workspace_members`).
  - [ ] API CRUD `Project` (Create, Update, Delete/Archive).
  - [ ] Logic: Check Permission (Only Owner can edit Workspace).
- **Frontend (Dev B)**:
  - [ ] Workspace Dashboard: List projects view.
  - [ ] "Create Project" Modal (Form validation).
  - [ ] Project Layout: Sidebar riêng cho Project (Board, List, Settings).
  - [ ] Settings Page: Tab "Members" để mời user.

#### 2. Definition of Done (DoD)

- [ ] Tạo được Project mới, dữ liệu lưu xuống DB thành công.
- [ ] Mời thành viên mới, record xuất hiện trong DB.
- [ ] Switch qua lại giữa các Project không bị crash trang.

#### 3. Deliverables

- Video demo: User flow từ Login -> Create Workspace -> Create Project.

---

### SPRINT 3: Task Management & Kanban Board (Tuần 5-6)

**Goal**: Hoàn thiện tính năng cốt lõi nhất - Quản lý công việc trên giao diện bảng.
**Focus**: Task Logic, Drag & Drop UI.

#### 1. Tasks Breakdown

- **Backend (Dev A)**:
  - [ ] API CRUD `Task`: Title, Desc, Priority, Due Date.
  - [ ] API Change Task Status (Move columns).
  - [ ] API Assign User to Task & Remove.
  - [ ] Design API filter (Get tasks by Status/Assignee).
- **Frontend (Dev B)**:
  - [ ] **Kanban Board UI**: Implement `dnd-kit` or `react-beautiful-dnd`.
  - [ ] Task Card Component: Show Title, Priority Badge, Assignee Avatar.
  - [ ] Logic: Optimistic Update (Update UI trước khi API trả về để mượt).
  - [ ] "My Tasks" View: List các task được assign cho mình.

#### 2. Definition of Done (DoD)

- [ ] Kéo thả Task giữa các cột (Todo -> Done) mượt mà, F5 không mất vị trí.
- [ ] Task Card hiển thị đúng thông tin assignee.
- [ ] API xử lý được concurrent updates cơ bản (Optional).

#### 3. Deliverables

- Feature hoàn chỉnh: Kanban Board.

---

### SPRINT 4: Collaboration & Realtime (Tuần 7-8)

**Goal**: Biến ứng dụng thành công cụ làm việc nhóm thời gian thực.
**Focus**: WebSocket, Comments, Notifications.

#### 1. Tasks Breakdown

- **Backend (Dev A)**:
  - [ ] Setup WebSocket Config (STOMP over SockJS).
  - [ ] API CRUD `Comment` (Parent/Child threading).
  - [ ] Logic: Push Notification khi có Comment/Assign mới.
  - [ ] API Upload File (Integration w/ AWS S3 or Local Storage).
- **Frontend (Dev B)**:
  - [ ] Task Detail Modal: Tab "Comments".
  - [ ] Integrate WebSocket Client: Auto-update comment list.
  - [ ] Notification Dropdown (Hiển thị list thông báo).
  - [ ] Rich Text Editor cho Comment (Bold, Italic, Link).

#### 2. Definition of Done (DoD)

- [ ] A comment -> B thấy ngay lập tức không cần reload.
- [ ] Upload ảnh đính kèm thành công.
- [ ] Click thông báo chuyển hướng đúng vào Task đó.

#### 3. Deliverables

- Demo tính năng Realtime Chat/Comment.

---

### SPRINT 5: Dashboard & Performance Tracking (Tuần 9-10)

**Goal**: Cung cấp dữ liệu báo cáo và chấm công.
**Focus**: Charts, Aggregation Queries.

#### 1. Tasks Breakdown

- **Backend (Dev A)**:
  - [ ] API `TimeEntry`: Start, Stop, Update duration.
  - [ ] Complex Query: Tính % hoàn thành dự án, số task quá hạn.
  - [ ] API Export Report (Generate PDF/Excel using Apache POI/iText).
- **Frontend (Dev B)**:
  - [ ] Timer Component: Nút Play/Pause trên Task Card.
  - [ ] Dashboard UI: Integrate `Recharts`.
    - Pie Chart: Task Status.
    - Bar Chart: Members Workload.
  - [ ] Export Button & Download flow.

#### 2. Definition of Done (DoD)

- [ ] Bấm giờ chạy đúng, không bị reset khi chuyển trang.
- [ ] Biểu đồ hiển thị đúng dữ liệu test.
- [ ] File export tải về mở được, format đẹp.

#### 3. Deliverables

- Module Reporting hoàn chỉnh.

---

### SPRINT 6: AI Integration (Enhanced Scope) (Tuần 11-12)

**Goal**: Tích hợp trí tuệ nhân tạo để hỗ trợ người dùng.
**Focus**: Integration with LLM (OpenAI/Gemini).

#### 1. Tasks Breakdown

- **Backend (Dev A)**:
  - [ ] Setup Client kết nối OpenAI API (hoặc Gemini).
  - [ ] Build Service: `AIService.generateSuggestion(taskList)`.
  - [ ] Build Service: `AIService.chatWithProjectData(query)`.
- **Frontend (Dev B)**:
  - [ ] AI Suggest Button (On Task Create form).
  - [ ] **AI Chat Widget**: Floating button ở góc màn hình.
  - [ ] Chat UI: Bong bóng chat user vs bot.
  - [ ] Loading skeletons khi chờ AI trả lời.

#### 2. Definition of Done (DoD)

- [ ] Chatbot trả lời được câu hỏi cơ bản về dự án.
- [ ] Gợi ý Assignee hoạt động dựa trên Skill của user (Mock data nếu cần).
- [ ] Xử lý lỗi khi API AI timeout.

#### 3. Deliverables

- Video demo tính năng AI "thông minh".

---

### SPRINT 7: Buffer & Stabilization (Tuần 13-14)

**Goal**: Đảm bảo hệ thống ổn định, không còn lỗi nghiêm trọng (Critical Bugs).
**Focus**: Testing, Bug Fixing, Optimization.

#### 1. Tasks Breakdown

- **Team**:
  - [ ] Rà soát lại toàn bộ 21 Use Cases.
  - [ ] Stress Test: Thử spam comment, tạo nghìn task xem load nổi không.
  - [ ] Fix UI glitches (Padding, Mobile responsive view).
  - [ ] Refactor code backend (Clean Architecture check).
  - [ ] Viết Unit Test bổ sung cho các luồng quan trọng (Payment/Auth).

#### 2. Definition of Done (DoD)

- [ ] Zero Critical Bugs.
- [ ] Lighthouse Score (Frontend) > 80.
- [ ] Code coverage > 40% (Optional).

---

### SPRINT 8: Final Delivery (Tuần 15)

**Goal**: Chuẩn bị tài nguyên tốt nhất cho buổi bảo vệ.
**Focus**: Deploy, Docs, Slide.

#### 1. Tasks Breakdown

- **Deploy**:
  - [ ] Backend lên Cloud (Render/Railway).
  - [ ] Frontend lên Vercel/Netlify.
  - [ ] Database lên Cloud (Supabase/Neon).
- **Docs**:
  - [ ] Hoàn thiện Báo cáo khóa luận (Word).
  - [ ] Slide PowerPoint (Tập trung vào giải pháp công nghệ & AI).
  - [ ] Kịch bản demo (Script chi tiết từng click chuột).

#### 2. Definition of Done (DoD)

- [ ] Hệ thống chạy live trên domain public.
- [ ] Slide và Báo cáo đã in/nộp.

#### 3. Deliverables

- **Final Product Package**.

---

## IV. Risk Management (AI Integration Scope)

Việc mở rộng AI Chatbot là rủi ro lớn nhất về mặt kỹ thuật và thời gian.

1.  **Rủi ro**: AI phản hồi chậm hoặc không chính xác.
    - _Mitigation_: Sử dụng mô hình đơn giản (GPT-3.5-turbo) để nhanh hơn. Cache các câu trả lời phổ biến.
    - _Fallback_: Nếu tích hợp Chatbot quá phức tạp, chuyển về tính năng "Smart Search" (Tìm kiếm thông minh) hoặc Form-based AI (Click button -> Generate).

2.  **Rủi ro**: Hết quota API hoặc chi phí cao.
    - _Mitigation_: Giới hạn rate-limit mỗi user. Chuẩn bị sẵn API Key dự phòng.
    - _Fallback_: Sử dụng Mock response cho buổi demo nếu API gặp vấn đề.

3.  **Dự trữ thời gian**:
    - Sprint 7 (2 tuần) là khoảng đệm an toàn. Nếu các Sprint trước bị trễ (ví dụ WebSocket làm lâu hơn dự kiến), cắn vào Sprint 7 để bù, chấp nhận cắt giảm bớt phần Testing/Optimize.
