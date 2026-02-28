# MVP Entity Relationship Diagram (ERD) - 10-Week Scope

**Chiến lược Rút gọn cho MVP (10 Tuần):**

1.  **Cắt bỏ Module**: Loại bỏ bảng `Permissions` & `Roles` động phức tạp. Sử dụng Hard-coded Enum cho Role (Admin/Member).
2.  **Đơn giản hóa**:
    - Gộp `Skills` quản lý (Master Data) vào text/tag đơn giản hoặc chỉ giữ quan hệ cơ bản.
    - Loại bỏ Custom Workflow (`task_statuses` động theo Project). Sử dụng trạng thái cố định (Todo/In Progress/Review/Done) để giảm logic FE/BE.
    - `Tags`, `Checklists` có thể lưu dạng JSON trong bảng `Tasks` để giảm số lượng bảng cần Join (nếu dùng Postgres/NoSQL), nhưng ở đây giữ bảng riêng để dễ query báo cáo hiệu suất.
3.  **Core Features**: Tập trung vào Task, Assignment, và Time Tracking (cho tính năng đánh giá).

```mermaid
erDiagram
    %% --- AUTH & USERS ---
    users ||--o{ user_skills : "has"
    users ||--o{ workspace_members : "joins"

    users {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        string avatar_url
        string bio
        json settings "Notification prefs, etc."
        timestamp created_at
    }

    %% Simplified Skills (Just for tagging users for AI suggestion)
    user_skills {
        bigint user_id PK, FK
        string skill_name "Java, React, etc."
        int level "1-5"
    }

    %% --- TEAM TEMPLATES (Quick Invite) ---
    %% Cho phép user lưu danh sách thành viên thường xuyên làm việc để invite nhanh vào Project
    users ||--o{ team_templates : "owns"
    team_templates ||--o{ team_member_templates : "contains"

    team_templates {
        bigint id PK
        bigint owner_id FK
        string name "e.g. Backend Team, Marketing Squad"
        timestamp created_at
    }

    team_member_templates {
        bigint team_template_id PK, FK
        string email "Email to invite"
        string role_default "Optional default role"
    }

    %% --- WORKSPACE & PROJECTS ---
    %% Logic Phân Quyền:
    %% 1. Workspace Role (Owner/Admin): Quản lý settings của Workspace, Billing, tạo Project mới.
    %% 2. Project Role (Manager): Quản lý settings của Project, add member vào Project.
    %% 3. Override Rule: Project Role có độ ưu tiên cao hơn trong phạm vi Project đó.
    %%    Ví dụ: Workspace Member (Role thấp) có thể là Project Manager (Role cao) trong Project A,
    %%    nhưng vẫn không thể chỉnh sửa Workspace Settings.

    workspaces ||--o{ workspace_members : "has"
    workspaces ||--o{ projects : "contains"

    workspaces {
        bigint id PK
        string name
        string owner_id FK
        timestamp created_at
    }

    workspace_members {
        bigint workspace_id PK, FK
        bigint user_id PK, FK
        string role "OWNER, ADMIN, MEMBER"
        timestamp joined_at
    }

    projects ||--o{ project_members : "has"
    projects ||--o{ tasks : "contains"

    %% Config cho Project Role Override
    projects {
        bigint id PK
        bigint workspace_id FK
        string name
        text description
        timestamp start_date
        timestamp end_date
        string status "ACTIVE, ARCHIVED"
        boolean is_private "If true, only project_members can access"
    }

    project_members {
        bigint project_id PK, FK
        bigint user_id PK, FK
        string role "MANAGER, MEMBER, VIEWER, GUEST"
    }

    %% --- TASKS & PERFORMANCE ---
    tasks ||--o{ task_assignees : "assigned_to"
    tasks ||--o{ time_entries : "logged_time"
    tasks ||--o{ comments : "discussed_in"
    tasks ||--o{ attachments : "has"
    tasks ||--o{ task_tags : "has"
    tags ||--o{ task_tags : "labeled_in"

    tasks {
        bigint id PK
        bigint project_id FK
        bigint parent_task_id FK "Nullable"
        string title
        text description
        string priority "LOW, MEDIUM, HIGH, URGENT"
        string status "TODO, IN_PROGRESS, REVIEW, DONE"
        timestamp due_date
        int position "Kanban sort order"
        timestamp created_at
    }

    tags {
        bigint id PK
        bigint project_id FK
        string name
        string color
    }

    task_tags {
        bigint task_id PK, FK
        bigint tag_id PK, FK
    }

    %% Many-to-Many Assignment (Required for 'Assign một hoặc nhiều người')
    task_assignees {
        bigint task_id PK, FK
        bigint user_id PK, FK
    }

    %% Critical for 'Đánh giá hiệu suất'
    time_entries {
        bigint id PK
        bigint task_id FK
        bigint user_id FK
        int duration_seconds
        timestamp created_at
    }

    %% --- COMMUNICATION (Rich Comments) ---
    comments ||--o{ comments : "replies_to"
    comments ||--o{ comment_mentions : "mentions"
    comments ||--o{ comment_reactions : "has"

    comments {
        bigint id PK
        bigint task_id FK
        bigint user_id FK
        bigint parent_comment_id FK "Nullable for threads"
        text content
        boolean is_edited
        timestamp created_at
        timestamp updated_at
    }

    comment_mentions {
        bigint comment_id PK, FK
        bigint user_id PK, FK "User mentioned"
    }

    comment_reactions {
        bigint id PK
        bigint comment_id FK
        bigint user_id FK
        string reaction_type "emoji code"
        timestamp created_at
    }

    attachments {
        bigint id PK
        bigint task_id FK
        bigint uploader_id FK
        string file_url
        string file_type
        timestamp created_at
    }
```
