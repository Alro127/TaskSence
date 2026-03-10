package dev.alro127.tasksense.security.permission;

/**
 * Tất cả các hành động có thể thực hiện ở cấp Project.
 * Muốn thêm permission mới → thêm enum value → cập nhật PermissionPolicy.
 */
public enum ProjectPermission {
    VIEW,
    UPDATE,
    DELETE,
    VIEW_MEMBERS,
    MANAGE_MEMBERS,
    CREATE_TASK,
    VIEW_TASKS,
    UPDATE_TASK,
    DELETE_TASK,
    UPDATE_TASK_STATUS
}
