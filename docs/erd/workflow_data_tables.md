# Detailed Description of Data Tables (Workflow & Guidance Module)

This document contains detailed data description tables for all entities of the **Workflow & Guidance** subsystem in the **TaskSense** system, based on standardized formats from the actual database (Flyway Migrations from `V11` to `V18`).

---

## List of Data Tables

1. [workflows](#1-bang-workflows-quy-trinh-mau) - Sample workflow.
2. [workflow_steps](#2-bang-workflow_steps-cac-buoc-cua-quy-trinh) - Process steps.
3. [workflow_step_tasks](#3-bang-workflow_step_tasks-lien-ket-buoc-quy-trinh-va-cong-viec-mau) - Links process steps and sample tasks.
4. [workflow_ratings](#4-bang-workflow_ratings-danh-gia-quy-trinh) - Process ratings from the community.
5. [workflow_favorites](#5-bang-workflow_favorites-yeu-thich-quy-trinh) - User's workflow favorites.
6. [workflow_comments](#6-bang-workflow_comments-binh-luan-quy-trinh) - Comments on the workflow.
7. [workflow_comment_mentions](#7-bang-workflow_comment_mentions-nhac-ten-nguoi-dung-trong-binh-luan) - Remind user name in comments.
8. [workflow_comment_reactions](#8-bang-workflow_comment_reactions-bay-to-cam-xuc-tren-binh-luan) - Emotions expressed on comments.
9. [workflow_guidance](#9-bang-workflow_guidance-dac-ta-huong-dan-chay-du-an) - Specification of instructions for automatically running a project.
10. [project_guidance_progress](#10-bang-project_guidance_progress-theo-doi-tien-do-chay-huong-dan-du-an) - Progress of running instructions on the actual project.
11. [project_guidance_completed_steps](#11-bang-project_guidance_completed_steps-theo-doi-cac-buoc-huong-dan-da-hoan-thanh) - Completed guidance steps of the project.
12. [project_guidance_target](#12-bang-project_guidance_target-theo-doi-muc-tieu-cua-tung-buoc-huong-dan) - Goal/milestone to achieve for each tutorial step.

---

### 1. Table `workflows` (Sample Procedure)
* **Meaning:** Stores sample process definition information (workflow) set up by a user or system based on an actual project for sharing or duplicating.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Sample process auto-increment ID |
| 2 | `project_id` | BIGINT | NOT NULL, FOREIGN KEY -> projects(id), ON DELETE CASCADE | ID of the source project used to create the process |
| 3 | `created_by` | BIGINT | NOT NULL, FOREIGN KEY -> users(id), ON DELETE RESTRICT | ID of the user creating the sample process |
| 4 | `name` | VARCHAR(255) | NOT NULL | Display name of sample process |
| 5 | `description` | TEXT | | Detailed description of the sample process |
| 6 | `status` | VARCHAR(50) | NOT NULL, DEFAULT 'DRAFT', CHECK (status IN ('DRAFT', 'PUBLIC')) | Process Status (DRAFT: Draft, PUBLIC: Public) |
| 7 | `generation_source` | VARCHAR(50) | NOT NULL, DEFAULT 'RULE_BASED', CHECK (generation_source IN ('RULE_BASED', 'AI_REFINED')) | Process generation origin (RULE_BASED: Based on configuration rules, AI_REFINED: Refined by AI) |
| 8 | `ai_refinement_requested` | BOOLEAN | NOT NULL, DEFAULT FALSE | Flag requesting AI system optimization/process fine-tuning |
| 9 | `published_at` | TIMESTAMPTZ | | When the process is publicly released |
| 10 | `publication_version` | INT | NOT NULL, DEFAULT 1 | Release version of the process |
| 11 | `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| 12 | `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Time of last record update |
| 13 | `deleted_at` | TIMESTAMPTZ | | Time to soft delete record (if any) |

* **List of indexes:**
  * `idx_workflows_project_id` ON `workflows(project_id)` - Optimize process queries by project.
  * `idx_workflows_status` ON `workflows(status)` - Optimize public process filtering.
  * `idx_workflows_status_published_at` ON `workflows(status, published_at DESC)` - Optimize display of the latest process list.

---

### 2. Table `workflow_steps` (Process steps)
* **Meaning:** Stores detailed information about the steps in a sample process.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Process step auto-increment ID |
| 2 | `workflow_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflows(id), ON DELETE CASCADE, UNIQUE (workflow_id, position) | The process ID containing this step |
| 3 | `title` | VARCHAR(255) | NOT NULL | Process step title |
| 4 | `description` | TEXT | | Describe in detail the tasks of step |
| 5 | `position` | INT | NOT NULL, DEFAULT 0, UNIQUE (workflow_id, position) | Order/Position of steps in the process |
| 6 | `source_type` | VARCHAR(50) | NOT NULL, DEFAULT 'RULE' | Step definition origin type (e.g. RULE, AI) |
| 7 | `source_sprint_id` | BIGINT | FOREIGN KEY -> sprints(id), ON DELETE SET NULL | ID of the corresponding parent sprint in the sample project |
| 8 | `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| 9 | `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Time of last record update |
| 10 | `deleted_at` | TIMESTAMPTZ | | Time to soft delete record (if any) |

* **List of indexes:**
  * `idx_workflow_steps_workflow_id` ON `workflow_steps(workflow_id)` - Optimize finding steps of a specific process.

---

### 3. Table `workflow_step_tasks` (Links process steps and sample jobs)
* **Meaning:** The intermediate table represents the Many-to-Many relationship between the steps in the process and the sample job heads copied/pre-established in that step.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | The link's auto-incrementing ID |
| 2 | `workflow_step_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflow_steps(id), ON DELETE CASCADE, UNIQUE (workflow_step_id, task_id) | ID of the corresponding process step |
| 3 | `task_id` | BIGINT | NOT NULL, FOREIGN KEY -> tasks(id), ON DELETE CASCADE, UNIQUE (workflow_step_id, task_id) | ID of the corresponding sample job |

* **List of indexes:**
  * `idx_workflow_step_tasks_workflow_step_id` ON `workflow_step_tasks(workflow_step_id)`
  * `idx_workflow_step_tasks_task_id` ON `workflow_step_tasks(task_id)`

---

### 4. Table `workflow_ratings` (Process Evaluation)
* **Meaning:** Allows community members to rate (star and write comments) a public sample process.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Self-incrementing ID of the review |
| 2 | `workflow_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflows(id), ON DELETE CASCADE, UNIQUE (workflow_id, user_id) | Evaluated process ID |
| 3 | `user_id` | BIGINT | NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE, UNIQUE (workflow_id, user_id) | User ID performing the review |
| 4 | `stars` | INT | NOT NULL, CHECK (stars BETWEEN 1 AND 5) | Number of rating stars (from 1 to 5 stars) |
| 5 | `review_text` | TEXT | | Detailed review content |
| 6 | `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | When the review was created |
| 7 | `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Time of last review update |

* **List of indexes:**
  * `idx_workflow_ratings_workflow_id` ON `workflow_ratings(workflow_id)`
  * `idx_workflow_ratings_user_id` ON `workflow_ratings(user_id)`

---

### 5. Table `workflow_favorites` (Process Favorites)
* **Meaning:** Stores a list of sample processes saved/marked as favorites by the user for easy future reference.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Auto-increasing ID of favorites |
| 2 | `workflow_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflows(id), ON DELETE CASCADE, UNIQUE (workflow_id, user_id) | Favorite Process ID |
| 3 | `user_id` | BIGINT | NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE, UNIQUE (workflow_id, user_id) | User ID clicked favorite |
| 4 | `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | When to add to favorites |

* **List of indexes:**
  * `idx_workflow_favorites_workflow_id` ON `workflow_favorites(workflow_id)`
  * `idx_workflow_favorites_user_id` ON `workflow_favorites(user_id)`

---

### 6. Table `workflow_comments` (Process comments)
* **Meaning:** Stores user discussions and Q&A on the details page of a public sample process. Supports threaded reply mechanism.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Comment auto-increment ID |
| 2 | `parent_comment_id` | BIGINT | FOREIGN KEY -> workflow_comments(id), ON DELETE CASCADE | Parent comment ID (if reply/reply) |
| 3 | `workflow_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflows(id), ON DELETE CASCADE | Process ID discussed |
| 4 | `user_id` | BIGINT | NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE | User ID wrote the comment |
| 5 | `content` | TEXT | NOT NULL | Detailed content of comments |
| 6 | `is_edited` | BOOLEAN | DEFAULT FALSE | Whether the comment status has been modified or not |
| 7 | `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Comment posting time |
| 8 | `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Time of last comment update |
| 9 | `deleted_at` | TIMESTAMPTZ | | Time to soft delete comments (if any) |

* **List of indexes:**
  * `idx_workflow_comments_workflow_id` ON `workflow_comments(workflow_id)`
  * `idx_workflow_comments_parent_id` ON `workflow_comments(parent_comment_id)`

---

### 7. Table `workflow_comment_mentions` (Remind user name in comment)
* **Meaning:** Saves relationships that mention the name (@mention) of another member in the comment section of the process.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID of name mention |
| 2 | `comment_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflow_comments(id), ON DELETE CASCADE, UNIQUE (comment_id, user_id) | The comment ID contains the mention |
| 3 | `user_id` | BIGINT | NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE, UNIQUE (comment_id, user_id) | User ID mentioned by name |

* **List of indexes:**
  * `idx_workflow_comment_mentions_user_id` ON `workflow_comment_mentions(user_id)` - Serves to display comments where the user is mentioned.

---

### 8. Table `workflow_comment_reactions` (Express your emotions in comments)
* **Meaning:** Allows storing emotional responses with emojis on each process comment.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Self-inflating ID of emotional interactions |
| 2 | `comment_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflow_comments(id), ON DELETE CASCADE, UNIQUE (comment_id, user_id, icon) | Comment ID receives interaction |
| 3 | `user_id` | BIGINT | NOT NULL, FOREIGN KEY -> users(id), ON DELETE CASCADE, UNIQUE (comment_id, user_id, icon) | User ID performing the interaction |
| 4 | `icon` | VARCHAR(50) | NOT NULL, UNIQUE (comment_id, user_id, icon) | The name or code of the emoji/emoticon |

* **List of indexes:**
  * `idx_workflow_comment_reactions_comment_id` ON `workflow_comment_reactions(comment_id)` - Quickly retrieve the reactions of a comment.

---

### 9. Table `workflow_guidance` (Project run specification)
* **Meaning:** Contains a JSON specification (including automated rules and goals) generated from the sample process. This specification acts as the "engine" to guide a project through the correct sample process.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | ID tự tăng của bản hướng dẫn |
| 2 | `workflow_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflows(id), ON DELETE CASCADE, UNIQUE (workflow_id, publication_version) | ID quy trình mẫu tương ứng |
| 3 | `publication_version` | INT | NOT NULL, UNIQUE (workflow_id, publication_version) | The corresponding release version of the process |
| 4 | `raw_json` | JSONB | NOT NULL | Configure JSONB format raw guidance rules |
| 5 | `summary_json` | JSONB | | Summary of JSONB format instructions |
| 6 | `generated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | When to automatically generate configuration from the template process |
| 7 | `is_user_edited` | BOOLEAN | NOT NULL, DEFAULT FALSE | Mark whether the user can edit the configuration or not |
| 8 | `edited_by` | BIGINT | FOREIGN KEY -> users(id), ON DELETE SET NULL | User ID edit configuration instructions |

* **List of indexes:**
  * `idx_workflow_guidance_workflow_id` ON `workflow_guidance(workflow_id)`

---

### 10. Table `project_guidance_progress` (Monitor the progress of running project instructions)
* **Meaning:** Tracks the current state of a project when applied to run a set of instructions from some sample process.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | ID tự tăng của tiến trình |
| 2 | `project_id` | BIGINT | NOT NULL, UNIQUE, FOREIGN KEY -> projects(id), ON DELETE CASCADE | ID of the actual project applying the wizard process |
| 3 | `workflow_guidance_id` | BIGINT | NOT NULL, FOREIGN KEY -> workflow_guidance(id), ON DELETE CASCADE | The corresponding instruction specification set ID is running |
| 4 | `current_step_id` | VARCHAR(255) | | ID of the currently active instruction step |
| 5 | `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Activation status (TRUE: Monitoring, FALSE: Suspended) |
| 6 | `started_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | When to trigger the tutorial process |
| 7 | `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Latest progress status update |

* **List of indexes:**
  * `idx_project_guidance_progress_project_id` ON `project_guidance_progress(project_id)`

---

### 11. Table `project_guidance_completed_steps` (Tracks completed instructions)
* **Meaning:** Keeps track of completed tutorial steps of a tutorial process in a project to avoid repeating runs.

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `progress_id` | BIGINT | PRIMARY KEY (progress_id, step_id), FOREIGN KEY -> project_guidance_progress(id), ON DELETE CASCADE | ID tiến trình hướng dẫn của dự án |
| 2 | `step_id` | VARCHAR(255) | PRIMARY KEY (progress_id, step_id) | ID of the completed tutorial step |

---

### 12. Table `project_guidance_target` (Track the goal of each step of the tutorial)
* **Meaning:** Stores quantitative progress for each action required at the current step (e.g. requires creating 2 tasks to complete the current step, this table tracks the actual completed amount).

| # | Attributes | Type | Binding | Meaning |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `id` | BIGSERIAL | PRIMARY KEY | Target auto-increment ID |
| 2 | `progress_id` | BIGINT | NOT NULL, FOREIGN KEY -> project_guidance_progress(id), ON DELETE CASCADE | Corresponding instruction progress ID |
| 3 | `step_id` | VARCHAR(255) | NOT NULL | The step ID contains the target |
| 4 | `target_type` | VARCHAR(255) | NOT NULL | Type of action to achieve (e.g. `CREATE_TASK`, `ASSIGN_MEMBER`, etc.) |
| 5 | `required_count` | INT | NOT NULL, DEFAULT 1 | Minimum number of attempts required |
| 6 | `current_count` | INT | NOT NULL, DEFAULT 0 | Number of actual recorded implementations of the project |
| 7 | `target_metadata` | JSONB | | Target's advanced configuration data |
| 8 | `is_completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Goal achieved status (TRUE: Done) |

* **List of indexes:**
  * `idx_project_guidance_target_progress_id` ON `project_guidance_target(progress_id)`