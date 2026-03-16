# Permission System Upgrade Guide

## Tổng quan thay đổi

Nâng cấp hệ thống phân quyền: thêm **Capability layer** và **Effective Permission Resolver**.
API giờ trả kèm `permissions` (Set\<String\>) trong response, FE chỉ cần check `permissions.includes("CREATE_TASK")`.

---

## Files thay đổi

### Mới tạo
| File | Mục đích |
|------|----------|
| `security/permission/TaskPermission.java` | Enum permission cấp Task (VIEW, EDIT, DELETE, UPDATE_STATUS) |
| `security/permission/EffectivePermissionResolver.java` | Trung tâm resolve effective permissions, có cache |
| `config/common/CacheConfig.java` | Caffeine in-memory cache config (TTL 5 phút) |

### Sửa đổi
| File | Thay đổi |
|------|----------|
| `security/permission/PermissionPolicy.java` | Thêm task-level policy (base + context modifiers) |
| `security/permission/PermissionChecker.java` | Delegate sang Resolver, thêm `requireTaskPermission()`, bỏ methods cũ |
| `dto/response/TaskResponse.java` | Thêm field `Set<String> permissions` |
| `dto/response/WorkspaceMemberResponse.java` | Thêm field `Set<String> permissions` |
| `dto/response/ProjectMemberResponse.java` | Thêm field `Set<String> permissions` |
| `service/impl/TaskServiceImpl.java` | Inject permissions vào mọi TaskResponse |
| `service/impl/WorkspaceMemberServiceImpl.java` | Inject workspace permissions + cache eviction |
| `service/impl/ProjectMemberServiceImpl.java` | Inject project permissions + cache eviction |
| `pom.xml` | Thêm spring-boot-starter-cache + caffeine |

---

## Kiến trúc sau nâng cấp

```
Request
  │
  ▼
@PreAuthorize("@perm.project(#id, 'CREATE_TASK')")   ← vẫn giữ nguyên
  │
  ▼
PermissionChecker ──delegate──► EffectivePermissionResolver
                                  │
                                  ├── resolveWorkspacePermissions(userId, wsId)     @Cacheable
                                  ├── resolveProjectPermissions(userId, projId)     @Cacheable
                                  ├── resolveTaskPermissions(userId, projId, task)  không cache (context-dependent)
                                  └── resolveEffectiveProjectRole(userId, projId)
                                          │
                                          ▼
                                    PermissionPolicy (ma trận role→permissions)
                                          │
                                          ├── Workspace: OWNER > MANAGER > MEMBER > VIEWER
                                          ├── Project: MANAGER > MEMBER > VIEWER
                                          └── Task: base(role) + context(creator/assignee)
```

---

## Permission logic cho Task

Task permissions = **base permissions theo role** + **context modifiers**

| Project Role | Base permissions | + isCreator | + isAssignee |
|-------------|-----------------|-------------|--------------|
| MANAGER | VIEW, EDIT, DELETE, UPDATE_STATUS | (đã có all) | (đã có all) |
| MEMBER | VIEW | +EDIT, +DELETE | +UPDATE_STATUS |
| VIEWER | VIEW | — | — |

---

## API Response thay đổi

### Trước
```json
{
  "id": 1,
  "role": "MEMBER",
  "title": "Fix bug"
}
```

### Sau
```json
{
  "id": 1,
  "role": "MEMBER",
  "title": "Fix bug",
  "permissions": ["VIEW", "EDIT", "DELETE"]
}
```

FE sử dụng:
```javascript
// Show/hide nút edit
const canEdit = task.permissions.includes("EDIT");

// Show/hide nút create task
const canCreate = projectContext.permissions.includes("CREATE_TASK");
```

---

## Caching

- **Provider**: Caffeine (in-memory)
- **TTL**: 5 phút (configurable trong `CacheConfig.java`)
- **Max size**: 1000 entries
- **Scope**: Workspace + Project permissions (cache key = `ws:userId:wsId` / `proj:userId:projId`)
- **Task permissions**: Không cache (phụ thuộc context ownership/assignment)
- **Eviction**: Tự động khi membership/role thay đổi (`evictAllPermissionCache()`)

---

## Hướng dẫn mở rộng cho resource mới

Khi cần thêm permission cho resource mới (ví dụ: Sprint, Comment, Document...):

### Bước 1: Tạo enum
```java
public enum SprintPermission {
    VIEW, CREATE, UPDATE, DELETE, MANAGE_TASKS
}
```

### Bước 2: Thêm policy vào `PermissionPolicy.java`
```java
private static final Map<ProjectMemberRole, Set<SprintPermission>> SPRINT_POLICY = Map.of(
    ProjectMemberRole.MANAGER, EnumSet.allOf(SprintPermission.class),
    ProjectMemberRole.MEMBER, EnumSet.of(SprintPermission.VIEW, SprintPermission.MANAGE_TASKS),
    ProjectMemberRole.VIEWER, EnumSet.of(SprintPermission.VIEW)
);

// Thêm context modifiers nếu cần (tương tự TASK_CREATOR_PERMISSIONS)
```

### Bước 3: Thêm resolve method vào `EffectivePermissionResolver.java`
```java
@Cacheable(value = "permissions", key = "'sprint:' + #userId + ':' + #sprintId")
public Set<String> resolveSprintPermissions(Long userId, Long projectId) {
    // Resolve logic tương tự resolveProjectPermissions
}
```

### Bước 4: Thêm field vào Response DTO
```java
public class SprintResponse {
    // ... existing fields
    private Set<String> permissions;
}
```

### Bước 5: Populate trong service
```java
SprintResponse response = SprintResponse.mapToResponse(entity);
response.setPermissions(permissionResolver.resolveSprintPermissions(userId, projectId));
```

---

## Breaking changes

**Không có breaking change cho FE hiện tại.**
- Field `permissions` mới thêm vào response, giá trị mặc định null nếu không set
- Tất cả `@PreAuthorize` annotation giữ nguyên
- API endpoints không đổi

**Breaking change cho code BE gọi trực tiếp:**
- `permissionChecker.requireTaskEditPermission()` → đổi thành `permissionChecker.requireTaskPermission(projectId, task, TaskPermission.EDIT)`
- `permissionChecker.requireTaskStatusPermission()` → đổi thành `permissionChecker.requireTaskPermission(projectId, task, TaskPermission.UPDATE_STATUS)`

---

## Lưu ý bảo mật

- `@PreAuthorize` vẫn là lớp enforcement chính (server-side, không bypass được)
- `permissions` trong response chỉ phục vụ UI rendering, KHÔNG phải authorization
- Task-level checks (`requireTaskPermission`) vẫn enforce ở service layer
- Cache eviction đảm bảo permissions cập nhật khi role thay đổi (+ TTL 5 phút backup)
