# Technical Notes

Ghi chú các quyết định thiết kế và giới hạn kỹ thuật quan trọng trong dự án.

---

## Task

### Giới hạn độ sâu cây task (Task Nesting Depth)
- **Giới hạn:** tối đa **5 cấp** (`MAX_TASK_DEPTH = 5`)
- **Lý do:** Task management thực tế hiếm khi cần quá 5 cấp. Giới hạn này tránh N query không kiểm soát khi validate circular parent.
- **Xử lý:** Nếu vượt quá → throw `BadRequestException`
- **Vị trí:** `TaskServiceImpl.MAX_TASK_DEPTH`

### Chống vòng lặp cha-con (Circular Parent Detection)
- Khi update `parentTaskId`, hệ thống traverse ngược lên cây tối đa `MAX_TASK_DEPTH` bước.
- Nếu phát hiện `taskId` trong chuỗi cha → throw `BadRequestException("Circular parent-child relationship detected")`

### Soft Delete
- Task không bị xóa khỏi DB, chỉ set `deleted_at = now()`
- `@SQLRestriction("deleted_at IS NULL")` trên `TaskEntity` đảm bảo các query JPA tự động lọc task đã xóa.

### Trạng thái `completedAt`
- Tự động set `completed_at = now()` khi `status` chuyển sang `DONE`
- Tự động clear `completed_at = null` khi `status` chuyển về trạng thái khác

### Phân quyền Task
- Mọi thao tác trên task đều yêu cầu user là **project member**
- Assignee cũng phải là **project member** — không thể assign task cho người ngoài project

### Position (Thứ tự task)
- Field `position` dùng để sắp xếp task trong cùng project + status (phục vụ drag & drop)
- Mặc định `position = 0` khi tạo mới

---

## API Endpoints - Task

Base path: `/projects/{projectId}/tasks`

| Method | Path | Mô tả |
|---|---|---|
| POST | `/` | Tạo task |
| GET | `/` | Lấy tất cả task của project |
| GET | `/search` | Tìm kiếm task (filter status, keyword, cursor pagination) |
| GET | `/{taskId}` | Lấy chi tiết task |
| GET | `/{taskId}/subtasks` | Lấy subtask |
| PUT | `/{taskId}` | Cập nhật task |
| DELETE | `/{taskId}` | Xóa mềm task |

> Dashboard (task across all projects) sẽ được implement ở controller riêng sau.

---

## Các TODO còn lại

- [ ] Implement `requireWorkspaceMember` trong `TaskServiceImpl`
- [ ] Dashboard controller: `GET /tasks/my` — lấy task được assign cho current user across all projects
