# Permission System Upgrade Guide

## Change overview

Upgrade the decentralized system: add **Capability layer** and **Effective Permission Resolver**.
The API now includes `permissions` (Set\<String\>) in the response, FE only needs to check `permissions.includes("CREATE_TASK")`.

---

## Files changed

### Just created
| File | Purpose |
|-----|----------|
| `security/permission/TaskPermission.java` | Enum permission at Task level (VIEW, EDIT, DELETE, UPDATE_STATUS) |
| `security/permission/EffectivePermissionResolver.java` | Resolve effective permissions center, with cache |
| `config/common/CacheConfig.java` | Caffeine in-memory cache config (TTL 5 minutes) |

### Edit
| File | Change |
|-----|----------|
| `security/permission/PermissionPolicy.java` | Add task-level policy (base + context modifiers) |
| `security/permission/PermissionChecker.java` | Delegate to Resolver, add `requireTaskPermission()`, remove old methods |
| `dto/response/TaskResponse.java` | Add field `Set<String> permissions` |
| `dto/response/WorkspaceMemberResponse.java` | Add field `Set<String> permissions` |
| `dto/response/ProjectMemberResponse.java` | Add field `Set<String> permissions` |
| `service/impl/TaskServiceImpl.java` | Inject permissions into every TaskResponse |
| `service/impl/WorkspaceMemberServiceImpl.java` | Inject workspace permissions + cache eviction |
| `service/impl/ProjectMemberServiceImpl.java` | Inject project permissions + cache eviction |
| `pom.xml` | Add spring-boot-starter-cache + caffeine |

---

## Architecture after upgrade

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

## Permission logic for Task

Task permissions = **base permissions by role** + **context modifiers**

| Project Role | Base permissions | + isCreator | + isAssignee |
|-------------|-----------|-------------|--------------|
| MANAGER | VIEW, EDIT, DELETE, UPDATE_STATUS | (already has all) | (already has all) |
| MEMBER | VIEW | +EDIT, +DELETE | +UPDATE_STATUS |
| VIEWER | VIEW | — | — |

---

## API Response changed

### Before
```json
{
  "id": 1,
  "role": "MEMBER",
  "title": "Fix bug"
}
```

### Later
```json
{
  "id": 1,
  "role": "MEMBER",
  "title": "Fix bug",
  "permissions": ["VIEW", "EDIT", "DELETE"]
}
```

FE uses:
```javascript
// Show/hide nút edit
const canEdit = task.permissions.includes("EDIT");

// Show/hide nút create task
const canCreate = projectContext.permissions.includes("CREATE_TASK");
```

---

##Caching

- **Provider**: Caffeine (in-memory)
- **TTL**: 5 minutes (configurable in `CacheConfig.java`)
- **Max size**: 1000 entries
- **Scope**: Workspace + Project permissions (cache key = `ws:userId:wsId` / `proj:userId:projId`)
- **Task permissions**: No cache (depends on context ownership/assignment)
- **Eviction**: Automatically when membership/role changes (`evictAllPermissionCache()`)

---

## Expanded instructions for new resources

When you need to add permission for a new resource (for example: Sprint, Comment, Document...):

### Step 1: Create enum
```java
public enum SprintPermission {
    VIEW, CREATE, UPDATE, DELETE, MANAGE_TASKS
}
```

### Step 2: Add policy to `PermissionPolicy.java`
```java
private static final Map<ProjectMemberRole, Set<SprintPermission>> SPRINT_POLICY = Map.of(
    ProjectMemberRole.MANAGER, EnumSet.allOf(SprintPermission.class),
    ProjectMemberRole.MEMBER, EnumSet.of(SprintPermission.VIEW, SprintPermission.MANAGE_TASKS),
    ProjectMemberRole.VIEWER, EnumSet.of(SprintPermission.VIEW)
);

// Thêm context modifiers nếu cần (tương tự TASK_CREATOR_PERMISSIONS)
```

### Step 3: Add resolve method to `EffectivePermissionResolver.java`
```java
@Cacheable(value = "permissions", key = "'sprint:' + #userId + ':' + #sprintId")
public Set<String> resolveSprintPermissions(Long userId, Long projectId) {
    // Resolve logic tương tự resolveProjectPermissions
}
```

### Step 4: Add field to Response DTO
```java
public class SprintResponse {
    // ... existing fields
    private Set<String> permissions;
}
```

### Step 5: Populate in service
```java
SprintResponse response = SprintResponse.mapToResponse(entity);
response.setPermissions(permissionResolver.resolveSprintPermissions(userId, projectId));
```

---

## Breaking changes

**There are no breaking changes for the current FE.**
- New field `permissions` added to response, default value is null if not set
- All `@PreAuthorize` annotations remain the same
- API endpoints remain unchanged

**Breaking change for direct call BE code:**
- `permissionChecker.requireTaskEditPermission()` → changed to `permissionChecker.requireTaskPermission(projectId, task, TaskPermission.EDIT)`
- `permissionChecker.requireTaskStatusPermission()` → changed to `permissionChecker.requireTaskPermission(projectId, task, TaskPermission.UPDATE_STATUS)`

---

## Security note

- `@PreAuthorize` is still the main enforcement layer (server-side, cannot be bypassed)
- `permissions` in response only serves UI rendering, NOT authorization
- Task-level checks (`requireTaskPermission`) are still enforced at the service layer
- Cache eviction ensures updated permissions when roles change (+ 5 minute backup TTL)