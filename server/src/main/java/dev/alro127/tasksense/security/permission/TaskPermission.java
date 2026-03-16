package dev.alro127.tasksense.security.permission;

/**
 * Tất cả các hành động có thể thực hiện ở cấp Task.
 * Muốn thêm permission mới → thêm enum value → cập nhật PermissionPolicy.
 */
public enum TaskPermission {
    VIEW,
    EDIT,
    DELETE,
    UPDATE_STATUS
}
