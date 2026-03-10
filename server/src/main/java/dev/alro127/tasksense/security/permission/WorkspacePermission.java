package dev.alro127.tasksense.security.permission;

/**
 * Tất cả các hành động có thể thực hiện ở cấp Workspace.
 * Muốn thêm permission mới → thêm enum value → cập nhật PermissionPolicy.
 */
public enum WorkspacePermission {
    VIEW,
    UPDATE,
    DELETE,
    VIEW_MEMBERS,
    MANAGE_MEMBERS,
    INVITE_MEMBERS,
    CREATE_PROJECT,
    MANAGE_JOIN_REQUESTS
}
