# User Flows & Use Cases (Aligned Scope)

Tài liệu này mô tả user flows theo phiên bản đã thống nhất:

- Target: team nhỏ 5-15 user, có Workspace layer
- MVP: không AI trực tiếp
- Phase 2: AI nâng cao
- Elasticsearch: search + analytics trong MVP

## 1. Actors

| Actor                  | Mô tả             | Quyền chính                                        |
| :--------------------- | :---------------- | :------------------------------------------------- |
| Workspace Owner        | Chủ workspace     | Quản lý workspace/member/project cấp cao           |
| Manager                | Quản lý dự án     | Quản lý task, member, dashboard                    |
| Member                 | Thành viên        | Thực hiện task, comment, upload file               |
| Viewer                 | Người xem         | Chỉ xem thông tin theo quyền                       |
| System Scheduler       | Tác nhân hệ thống | Batch sync PostgreSQL -> Elasticsearch             |
| AI Assistant (Phase 2) | Tác nhân AI       | Smart Assign, Subtask Gen, Chatbot, Performance AI |

---

## 2. Core User Flows (MVP)

### 2.1 Authentication & Onboarding

```mermaid
sequenceDiagram
    participant User
    participant System
    participant EmailService

    User->>System: Register (email, password)
    System->>EmailService: Send OTP
    EmailService-->>User: Receive OTP
    User->>System: Verify OTP
    System-->>User: Account activated

    User->>System: Login
    System-->>User: JWT + Redirect Dashboard
```

### 2.2 Workspace & Project Setup

```mermaid
flowchart TD
    A[User login] --> B[Create Workspace]
    B --> C[Invite Members]
    C --> D[Create Project]
    D --> E[Assign Member Roles]
    E --> F[Open Project Board]
```

### 2.3 Task Lifecycle (Fixed Status)

```mermaid
stateDiagram-v2
    [*] --> TODO: Create Task
    TODO --> IN_PROGRESS: Start work
    IN_PROGRESS --> REVIEW: Submit for review
    REVIEW --> DONE: Approved
    REVIEW --> IN_PROGRESS: Rework
    DONE --> [*]
```

### 2.4 Collaboration + Notification

```mermaid
sequenceDiagram
    participant M as Member
    participant S as System
    participant U as Mentioned User

    M->>S: Comment + @mention
    S->>S: Save comment
    S-->>U: Create notification
    U->>S: Open notification bell
    S-->>U: Navigate to related task
```

### 2.5 Search & Analytics (Elasticsearch)

```mermaid
flowchart LR
    A[PostgreSQL Data] --> B[Batch Sync Job]
    B --> C[Elasticsearch Index]
    C --> D[Search API]
    C --> E[Analytics API]
    D --> F[Task/Project/User Search]
    E --> G[Throughput + Overdue Trends Dashboard]
```

---

## 3. Phase 2 Flows (AI)

### 3.1 AI Smart Assign

- Input: task context + user skill/activity profile
- Output: danh sách assignee đề xuất

### 3.2 AI Auto Subtask Generation

- Input: mô tả task lớn
- Output: danh sách subtasks/checklist gợi ý

### 3.3 AI Chatbot (RAG)

- Retrieval: Elasticsearch
- Generation: LLM response theo ngữ cảnh dự án

### 3.4 AI Performance Evaluation

- Input: activity signals
- Output: đánh giá xu hướng hiệu suất và cảnh báo

---

## 4. Use Case Index (Rút gọn)

- UC01-UC04: Auth & Profile
- UC05-UC08: Workspace & Project
- UC09-UC13: Task, Collaboration, Notification
- UC14-UC17: Search & Analytics (Elasticsearch)
- UC18-UC21: AI Features (Phase 2)
