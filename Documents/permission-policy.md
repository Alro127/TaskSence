# Permission Policy - TaskSense

## 1. Tổng quan kiến trúc

Hệ thống phân quyền được thiết kế theo mô hình **centralized policy matrix**, gồm 4 file chính:

| File | Vai trò |
|------|---------|
| `PermissionPolicy.java` | Ma trận phân quyền tập trung — nơi **duy nhất** quyết định role nào có permission nào |
| `PermissionChecker.java` | Bean `@perm` dùng cho `@PreAuthorize` SpEL và service-layer permission checks |
| `WorkspacePermission.java` | Enum định nghĩa tất cả hành động cấp Workspace |
| `ProjectPermission.java` | Enum định nghĩa tất cả hành động cấp Project |

### Luồng kiểm tra quyền

```
HTTP Request
  → Controller (@PreAuthorize("@perm.workspace/project(...)"))   ← role-based check
    → Service layer (permissionChecker.requireTaskEditPermission) ← resource-level check
```

---

## 2. Workspace Permissions

### Enum `WorkspacePermission`

| Permission | Mô tả |
|---|---|
| `VIEW` | Xem thông tin workspace |
| `UPDATE` | Cập nhật workspace |
| `DELETE` | Xóa workspace |
| `VIEW_MEMBERS` | Xem danh sách thành viên |
| `MANAGE_MEMBERS` | Thêm/xóa/đổi role thành viên |
| `INVITE_MEMBERS` | Gửi lời mời tham gia workspace |
| `CREATE_PROJECT` | Tạo project trong workspace |
| `MANAGE_JOIN_REQUESTS` | Duyệt yêu cầu tham gia workspace |

### Ma trận phân quyền Workspace

| Permission | OWNER | MANAGER | MEMBER | VIEWER |
|---|:---:|:---:|:---:|:---:|
| `VIEW` | x | x | x | x |
| `UPDATE` | x | | | |
| `DELETE` | x | | | |
| `VIEW_MEMBERS` | x | x | x | x |
| `MANAGE_MEMBERS` | x | x | | |
| `INVITE_MEMBERS` | x | x | | |
| `CREATE_PROJECT` | x | | | |
| `MANAGE_JOIN_REQUESTS` | x | x | | |

> **OWNER** có toàn quyền (`EnumSet.allOf`). Chỉ OWNER mới có thể `UPDATE`, `DELETE` workspace và `CREATE_PROJECT`.

---

## 3. Project Permissions

### Enum `ProjectPermission`

| Permission | Mô tả |
|---|---|
| `VIEW` | Xem thông tin project |
| `UPDATE` | Cập nhật project |
| `DELETE` | Xóa project |
| `VIEW_MEMBERS` | Xem danh sách thành viên project |
| `MANAGE_MEMBERS` | Thêm/xóa/đổi role thành viên project |
| `CREATE_TASK` | Tạo task |
| `VIEW_TASKS` | Xem danh sách task |
| `UPDATE_TASK` | Cập nhật task |
| `DELETE_TASK` | Xóa task |
| `UPDATE_TASK_STATUS` | Cập nhật trạng thái task |

### Ma trận phân quyền Project

| Permission | MANAGER | MEMBER | VIEWER |
|---|:---:|:---:|:---:|
| `VIEW` | x | x | x |
| `UPDATE` | x | | |
| `DELETE` | x | | |
| `VIEW_MEMBERS` | x | x | x |
| `MANAGE_MEMBERS` | x | | |
| `CREATE_TASK` | x | x | |
| `VIEW_TASKS` | x | x | x |
| `UPDATE_TASK` | x | x | |
| `DELETE_TASK` | x | x | |
| `UPDATE_TASK_STATUS` | x | x | |

> **MANAGER** có toàn quyền (`EnumSet.allOf`). **VIEWER** chỉ có thể xem (VIEW, VIEW_MEMBERS, VIEW_TASKS).

---

## 4. Quy tắc đặc biệt

### Workspace OWNER → implicit full project access

Khi kiểm tra quyền cấp project, nếu user **không phải project member** thì hệ thống fallback kiểm tra: nếu user là **Workspace OWNER** của workspace chứa project đó → **tự động có full access**.

```java
// PermissionChecker.project()
// 1. Check project-level role
// 2. Fallback: workspace OWNER luôn có full project access
return isWorkspaceOwnerOfProject(projectId, userId);
```

### Resource-level permission cho Task

Ngoài role-based check ở controller (`@PreAuthorize`), service layer còn kiểm tra **resource-level**:

| Hành động | MANAGER / WS OWNER | MEMBER |
|---|---|---|
| **Edit task** (update/delete) | Bất kỳ task nào | Chỉ task do mình tạo (`createdBy`) |
| **Update task status** | Bất kỳ task nào | Task do mình tạo **hoặc** được assign |

---

## 5. Cách sử dụng trong Controller

### Workspace-level check

```java
@PreAuthorize("@perm.workspace(#workspaceId, 'CREATE_PROJECT')")
@PreAuthorize("@perm.workspace(#workspaceId, 'INVITE_MEMBERS')")
@PreAuthorize("@perm.workspace(#workspaceId, 'MANAGE_MEMBERS')")
```

### Project-level check

```java
@PreAuthorize("@perm.project(#projectId, 'VIEW_TASKS')")
@PreAuthorize("@perm.project(#projectId, 'CREATE_TASK')")
@PreAuthorize("@perm.project(#projectId, 'MANAGE_MEMBERS')")
```

### Workspace membership check (bất kỳ role)

```java
@PreAuthorize("@perm.workspaceMember(#workspaceId)")
```

---

## 6. Mapping Controller → Permission

### WorkspaceController (`/workspaces`)

| Endpoint | Method | Permission |
|---|---|---|
| `/workspaces` | POST | Authenticated (tự do) |
| `/workspaces` | GET | Authenticated (workspace của mình) |
| `/workspaces/{id}` | GET | `workspace(VIEW)` |
| `/workspaces/{id}` | PUT | `workspace(UPDATE)` |
| `/workspaces/{id}` | DELETE | `workspace(DELETE)` |

### WorkspaceMemberController (`/workspaces/{id}/members`)

| Endpoint | Method | Permission |
|---|---|---|
| `/{workspaceId}/members` | GET | `workspace(VIEW_MEMBERS)` |
| `/{workspaceId}/members/{memberId}` | PATCH | `workspace(MANAGE_MEMBERS)` |
| `/{workspaceId}/members/{memberId}` | DELETE | `workspace(MANAGE_MEMBERS)` |

### WorkspaceInviteController (`/workspaces/{id}/invites`)

| Endpoint | Method | Permission |
|---|---|---|
| `/{workspaceId}/invites` | POST | `workspace(INVITE_MEMBERS)` |
| `/{workspaceId}/invites/bulk` | POST | `workspace(INVITE_MEMBERS)` |
| `/{workspaceId}/invites` | GET | `workspace(INVITE_MEMBERS)` |

### ProjectController (`/workspaces/{workspaceId}/projects`)

| Endpoint | Method | Permission |
|---|---|---|
| `/` | POST | `workspace(CREATE_PROJECT)` |
| `/` | GET | `workspace(VIEW)` |
| `/{projectId}` | GET | `project(VIEW)` |
| `/{projectId}` | PUT | `project(UPDATE)` |
| `/{projectId}` | DELETE | `project(DELETE)` |

### ProjectMemberController (`/projects/{projectId}/members`)

| Endpoint | Method | Permission |
|---|---|---|
| `/` | POST | `project(MANAGE_MEMBERS)` |
| `/` | GET | `project(VIEW_MEMBERS)` |
| `/{userId}/role` | PATCH | `project(MANAGE_MEMBERS)` |
| `/{userId}` | DELETE | `project(MANAGE_MEMBERS)` |
| `/me/role` | GET | Authenticated (tự do) |

### TaskController (`/projects/{projectId}/tasks`)

| Endpoint | Method | Permission | Resource-level |
|---|---|---|---|
| `/` | POST | `project(CREATE_TASK)` | — |
| `/` | GET | `project(VIEW_TASKS)` | — |
| `/search` | GET | `project(VIEW_TASKS)` | — |
| `/{taskId}` | GET | `project(VIEW_TASKS)` | — |
| `/{taskId}/subtasks` | GET | `project(VIEW_TASKS)` | — |
| `/{taskId}` | PUT | `project(UPDATE_TASK)` | `requireTaskEditPermission` |
| `/{taskId}/status` | PATCH | `project(UPDATE_TASK_STATUS)` | `requireTaskStatusPermission` |
| `/{taskId}` | DELETE | `project(DELETE_TASK)` | `requireTaskEditPermission` |

---

## 7. Mở rộng

- **Thêm permission mới**: thêm enum value vào `WorkspacePermission` hoặc `ProjectPermission` → cập nhật map trong `PermissionPolicy`.
- **Chuyển sang DB-driven**: thay `Map` tĩnh trong `PermissionPolicy` bằng repository, load lúc startup hoặc cache.
