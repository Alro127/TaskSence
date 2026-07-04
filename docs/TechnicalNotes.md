# Technical Notes

Note important design decisions and technical constraints in the project.

---

## Tasks

### Limit task tree depth (Task Nesting Depth)
- **Limit:** maximum **5 levels** (`MAX_TASK_DEPTH = 5`)
- **Reason:** Practical task management rarely needs more than 5 levels. This limit avoids uncontrolled N queries when validating circular parents.
- **Handling:** If exceeded → throw `BadRequestException`
- **Location:** `TaskServiceImpl.MAX_TASK_DEPTH`

### Circular Parent Detection
- When updating `parentTaskId`, the system traverses up the tree up to `MAX_TASK_DEPTH` steps.
- If `taskId` is detected in the parent string → throw `BadRequestException("Circular parent-child relationship detected")`

### Soft Delete
- Task is not deleted from the database, only `deleted_at = now()` is set
- `@SQLRestriction("deleted_at IS NULL")` over `TaskEntity` ensures JPA queries automatically filter deleted tasks.

### Status `completedAt`
- Automatically set `completed_at = now()` when `status` changes to `DONE`
- Automatically clear `completed_at = null` when `status` changes to another state

### Decentralize Task
- All operations on the task require the user to be **project member**
- Assignee must also be a **project member** — tasks cannot be assigned to people outside the project

### Position (Task order)
- Field `position` is used to sort tasks in the same project + status (for drag & drop)
- Default is `position = 0` when creating a new one

---

## API Endpoints - Task

Base path: `/projects/{projectId}/tasks`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create task |
| GET | `/` | Get all project tasks |
| GET | `/search` | Search task (filter status, keyword, cursor pagination) |
| GET | `/{taskId}` | Get task details |
| GET | `/{taskId}/subtasks` | Get subtask |
| PUT | `/{taskId}` | Update tasks |
| DELETE | `/{taskId}` | Soft delete task |

> Dashboard (task across all projects) will be implemented in a separate controller later.

---

## The remaining TODOs

- [ ] Implement `requireWorkspaceMember` in `TaskServiceImpl`
- [ ] Dashboard controller: `GET /tasks/my` — get tasks assigned to current user across all projects