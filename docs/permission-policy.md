# Permission Policy - TaskSense

## 1. Architecture overview

The decentralized system is designed according to the **centralized policy matrix** model, including 4 main files:

| File | Role |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `PermissionPolicy.java` | Centralized permission matrix — the **only place** that decides which roles have which permissions |
| `PermissionChecker.java` | Bean `@perm` used for `@PreAuthorize` SpEL and service-layer permission checks |
| `WorkspacePermission.java` | Enum defines all Workspace | level actions
| `ProjectPermission.java` | Enum defines all Project | level actions

### Permission checking flow

```
HTTP Request
  → Controller (@PreAuthorize("@perm.workspace/project(...)"))   ← role-based check
    → Service layer (permissionChecker.requireTaskEditPermission) ← resource-level check
```

---

## 2. Workspace Permissions

### Enum `WorkspacePermission`

| Permission | Description |
| ---------------------- | -------------------------------- |
| `VIEW` | View workspace information |
| `UPDATE` | Update workspace |
| `DELETE` | Delete workspace |
| `VIEW_MEMBERS` | View member list |
| `MANAGE_MEMBERS` | Add/delete/change member roles |
| `INVITE_MEMBERS` | Send invitation to join workspace |
| `CREATE_PROJECT` | Create project in workspace |
| `MANAGE_JOIN_REQUESTS` | Browse requests to join workspace |

### Workspace authorization matrix

| Permission | OWNER | MANAGER | MEMBER | VIEWER |
| ---------------------- | :---: | :-----: | :----: | :----: |
| `VIEW` |   x |    x |   x |   x |
| `UPDATE` |   x |         |        |        |
| `DELETE` |   x |         |        |        |
| `VIEW_MEMBERS` |   x |    x |   x |   x |
| `MANAGE_MEMBERS` |   x |    x |        |        |
| `INVITE_MEMBERS` |   x |    x |        |        |
| `CREATE_PROJECT` |   x |         |        |        |
| `MANAGE_JOIN_REQUESTS` |   x |    x |        |        |

> **OWNER** has full authority (`EnumSet.allOf`). Only OWNER can `UPDATE`, `DELETE` workspace and `CREATE_PROJECT`.

---

## 3. Project Permissions

### Enum `ProjectPermission`

| Permission | Description |
| -------------------- | ------------------------------------ |
| `VIEW` | View project information |
| `UPDATE` | Update project |
| `DELETE` | Delete project |
| `VIEW_MEMBERS` | View project member list |
| `MANAGE_MEMBERS` | Add/remove/change project member roles |
| `CREATE_TASK` | Create task |
| `VIEW_TASKS` | View task list |
| `UPDATE_TASK` | Update tasks |
| `DELETE_TASK` | Delete tasks |
| `UPDATE_TASK_STATUS` | Update task status |

### Project delegation matrix

| Permission | MANAGER | MEMBER | VIEWER |
| -------------------- | :-----: | :----: | :----: |
| `VIEW` |    x |   x |   x |
| `UPDATE` |    x |        |        |
| `DELETE` |    x |        |        |
| `VIEW_MEMBERS` |    x |   x |   x |
| `MANAGE_MEMBERS` |    x |        |        |
| `CREATE_TASK` |    x |   x |        |
| `VIEW_TASKS` |    x |   x |   x |
| `UPDATE_TASK` |    x |   x |        |
| `DELETE_TASK` |    x |   x |        |
| `UPDATE_TASK_STATUS` |    x |   x |        |

> **MANAGER** has full authority (`EnumSet.allOf`). **VIEWER** can only view (VIEW, VIEW_MEMBERS, VIEW_TASKS).

---

## 4. Special rules

### Implicit project access based on Workspace role

When checking project-level permissions, if the user is **not a project member**, the fallback system checks the workspace role:

| Workspace Role | Implicit Project Access |
| ------------------- | ---------------------------------------------------------- |
| `OWNER` | Full access (equivalent to Project MANAGER) |
| `MANAGER` | VIEWER-level access (`VIEW`, `VIEW_MEMBERS`, `VIEW_TASKS`) |
| `MEMBER` / `VIEWER` | There is no implicit project access |

```java
// PermissionChecker.project()
// 1. Check project-level role
// 2. Fallback: check workspace role for implicit project access
private boolean hasImplicitProjectPermission(Long projectId, Long userId, ProjectPermission permission) {
    // ...
    if (wsMember.getRole() == WorkspaceRole.OWNER) {
        return true; // full access
    }
    if (wsMember.getRole() == WorkspaceRole.MANAGER) {
        return policy.hasProjectPermission(ProjectMemberRole.VIEWER, permission); // viewer-level
    }
    return false;
}
```

### Resource-level permission for Task

In addition to role-based checks on the controller (`@PreAuthorize`), the service layer also checks **resource-level**:

| Action | MANAGER / WS OWNER | MEMBER |
| ----------------------------- | ------------------ | ------------------------------------- |
| **Edit task** (update/delete) | Any task | Only tasks created by me (`createdBy`) |
| **Update task status** | Any task | Task created by me **or** assigned |

---

## 5. How to use in Controller

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

### Workspace membership check (any role)

```java
@PreAuthorize("@perm.workspaceMember(#workspaceId)")
```

---

## 6. Mapping Controller → Permission

### WorkspaceController (`/workspaces`)

| Endpoints | Method | Permission |
| ------------------ | ------ | ---------------------------------- |
| `/workspaces` | POST | Authenticated (free) |
| `/workspaces` | GET | Authenticated (my workspace) |
| `/workspaces/{id}` | GET | `workspace(VIEW)` |
| `/workspaces/{id}` | PUT | `workspace(UPDATE)` |
| `/workspaces/{id}` | DELETE | `workspace(DELETE)` |

### WorkspaceMemberController (`/workspaces/{id}/members`)

| Endpoints | Method | Permission |
| ----------------------------------- | ------ | ------------------------- |
| `/{workspaceId}/members` | GET | `workspace(VIEW_MEMBERS)` |
| `/{workspaceId}/members/{memberId}` | PATCH | `workspace(MANAGE_MEMBERS)` |
| `/{workspaceId}/members/{memberId}` | DELETE | `workspace(MANAGE_MEMBERS)` |

### WorkspaceInviteController (`/workspaces/{id}/invites`)

| Endpoints | Method | Permission |
| ----------------------------- | ------ | ------------------------- |
| `/{workspaceId}/invites` | POST | `workspace(INVITE_MEMBERS)` |
| `/{workspaceId}/invites/bulk` | POST | `workspace(INVITE_MEMBERS)` |
| `/{workspaceId}/invites` | GET | `workspace(INVITE_MEMBERS)` |

### ProjectController (`/workspaces/{workspaceId}/projects`)

| Endpoints | Method | Permission |
| -------------- | ------ | ------------------------- |
| `/` | POST | `workspace(CREATE_PROJECT)` |
| `/` | GET | `workspace(VIEW)` |
| `/{projectId}` | GET | `project(VIEW)` |
| `/{projectId}` | PUT | `project(UPDATE)` |
| `/{projectId}` | DELETE | `project(DELETE)` |

### ProjectMemberController (`/projects/{projectId}/members`)

| Endpoints | Method | Permission |
| ---------------- | ------ | ------------------------- |
| `/` | POST | `project(MANAGE_MEMBERS)` |
| `/` | GET | `project(VIEW_MEMBERS)` |
| `/{userId}/role` | PATCH | `project(MANAGE_MEMBERS)` |
| `/{userId}` | DELETE | `project(MANAGE_MEMBERS)` |
| `/me/role` | GET | Authenticated (free) |

### TaskController (`/projects/{projectId}/tasks`)

| Endpoints | Method | Permission | Resource-level |
| -------------------- | ------ | ----------------------------- | ----------------------------- |
| `/` | POST | `project(CREATE_TASK)` | — |
| `/` | GET | `project(VIEW_TASKS)` | — |
| `/search` | GET | `project(VIEW_TASKS)` | — |
| `/{taskId}` | GET | `project(VIEW_TASKS)` | — |
| `/{taskId}/subtasks` | GET | `project(VIEW_TASKS)` | — |
| `/{taskId}` | PUT | `project(UPDATE_TASK)` | `requireTaskEditPermission` |
| `/{taskId}/status` | PATCH | `project(UPDATE_TASK_STATUS)` | `requireTaskStatusPermission` |
| `/{taskId}` | DELETE | `project(DELETE_TASK)` | `requireTaskEditPermission` |

---

## 7. Expand

- **Add new permission**: add enum value to `WorkspacePermission` or `ProjectPermission` → update map in `PermissionPolicy`.
- **Switch to DB-driven**: replace static `Map` in `PermissionPolicy` with repository, load at startup or cache.