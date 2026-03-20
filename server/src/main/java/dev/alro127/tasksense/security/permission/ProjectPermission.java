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
    VIEW_TAGS,
    CREATE_TAG,
    UPDATE_TAG,
    DELETE_TAG,
    MANAGE_TAG,
    VIEW_SPRINTS,
    CREATE_SPRINT,
    UPDATE_SPRINT,
    DELETE_SPRINT,
    MANAGE_SPRINT,
    CREATE_TASK,
    VIEW_TASKS,
    UPDATE_TASK,
    DELETE_TASK,
    UPDATE_TASK_STATUS
}
