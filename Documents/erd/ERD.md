# Entity Relationship Diagram (Aligned Scope)

## 1. Ghi chú thiết kế

- MVP ưu tiên nghiệp vụ cốt lõi cho team 5-15 user.
- Task workflow dùng trạng thái cố định: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- Không dùng manual timer/time logging trong MVP.
- Elasticsearch được dùng làm search + analytics store, đồng bộ batch từ PostgreSQL.

---

## 2. Relational ERD (PostgreSQL)

```mermaid
erDiagram
    users ||--o{ user_skills : has
    users ||--o{ workspace_members : joins
    users ||--o{ team_templates : owns
    users ||--o{ notifications : receives
    users ||--o{ activities : performs
    team_templates ||--o{ team_member_templates : contains

    workspaces ||--o{ workspace_members : has
    workspaces ||--o{ projects : contains

    projects ||--o{ project_members : has
    projects ||--o{ tasks : contains

    tasks ||--o{ task_assignees : assigned_to
    tasks ||--o{ task_tags : has
    tags ||--o{ task_tags : labeled_in

    tasks ||--o{ comments : discussed_in
    comments ||--o{ comment_mentions : mentions
    comments ||--o{ comment_reactions : has

    tasks ||--o{ attachments : has

    users {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        string avatar_url
        string phone
        string gender
        date dob
        text bio
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    user_skills {
        bigint user_id PK, FK
        string skill_name PK
        int level
    }

    team_templates {
        bigint id PK
        bigint owner_id FK
        string name
        text description
        timestamp created_at
    }

    team_member_templates {
        bigint id PK
        bigint team_template_id FK
        bigint user_id FK
    }

    workspaces {
        bigint id PK
        string name
        bigint owner_id FK
        timestamp created_at
    }

    workspace_members {
        bigint id PK
        bigint workspace_id FK
        bigint user_id FK
        string role
        timestamp joined_at
    }

    projects {
        bigint id PK
        bigint workspace_id FK
        string name
        text description
        string status
        date start_date
        date end_date
        timestamp created_at
    }

    project_members {
        bigint id PK
        bigint project_id FK
        bigint user_id FK
        string role
    }

    tasks {
        bigint id PK
        bigint project_id FK
        bigint parent_task_id FK
        string title
        text description
        string priority
        string status
        date due_date
        int position
        bigint created_by FK
        timestamp created_at
        timestamp updated_at
    }

    task_assignees {
        bigint task_id PK, FK
        bigint user_id PK, FK
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

    comments {
        bigint id PK
        bigint task_id FK
        bigint user_id FK
        bigint parent_comment_id FK
        text content
        boolean is_edited
        timestamp created_at
        timestamp updated_at
    }

    comment_mentions {
        bigint comment_id PK, FK
        bigint user_id PK, FK
    }

    comment_reactions {
        bigint comment_id PK, FK
        bigint user_id PK, FK
        string icon PK
    }

    attachments {
        bigint id PK
        bigint task_id FK
        bigint uploader_id FK
        string file_url
        string file_type
        bigint file_size
        timestamp created_at
    }

    notifications {
        bigint id PK
        bigint user_id FK
        string type
        string title
        text content
        bigint related_task_id FK
        bigint related_project_id FK
        boolean is_read
        timestamp created_at
    }

    activities {
        bigint id PK
        bigint user_id FK
        string action_type
        string entity_type
        bigint entity_id
        text description
        jsonb metadata
        timestamp created_at
    }
```

---

## 3. Elasticsearch Index Model (MVP)

```mermaid
flowchart TD
    PG[(PostgreSQL)] --> JOB[Batch Sync Scheduler]
    JOB --> I1[(task_index)]
    JOB --> I2[(project_index)]
    JOB --> I3[(user_index)]

    I1 --> SEARCH[Search API]
    I2 --> SEARCH
    I3 --> SEARCH

    I1 --> ANA[Analytics API]
    ANA --> KPI1[Task Throughput]
    ANA --> KPI2[Overdue Trends]
```

### Index phạm vi MVP

- `task_index`: title, description, status, priority, due_date, assignees
- `project_index`: name, description, status
- `user_index`: full_name, skills, role

### Vận hành MVP

- Đồng bộ: batch theo lịch
- Reindex: manual command
- Ngôn ngữ search: tiếng Việt + tiếng Anh

---

## 4. Phase 2 Extensions

- AI retrieval cho chatbot RAG qua Elasticsearch
- Analytics mở rộng: workload by assignee, comment activity
- AI performance evaluation từ activity signals
