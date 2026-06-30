package dev.alro127.tasksense.security.permission;

import org.springframework.stereotype.Component;

import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Ma trận phân quyền tập trung.
 * Đây là NƠI DUY NHẤT quyết định role nào có permission nào.
 *
 * Workspace hierarchy: OWNER > MANAGER > MEMBER > VIEWER
 * Project hierarchy: MANAGER > MEMBER > VIEWER
 *
 * Để thay đổi quyền → chỉ cần chỉnh Map bên dưới.
 * Để chuyển sang DB-driven → inject repository, load lúc startup hoặc cache.
 */
@Component
public class PermissionPolicy {

        // ========================= WORKSPACE =========================

        private static final Map<WorkspaceRole, Set<WorkspacePermission>> WORKSPACE_POLICY = Map.of(
                        WorkspaceRole.OWNER, EnumSet.allOf(WorkspacePermission.class),

                        WorkspaceRole.MANAGER, EnumSet.of(
                                        WorkspacePermission.VIEW,
                                        WorkspacePermission.VIEW_MEMBERS,
                                        WorkspacePermission.MANAGE_MEMBERS,
                                        WorkspacePermission.INVITE_MEMBERS,
                                        WorkspacePermission.MANAGE_JOIN_REQUESTS),

                        WorkspaceRole.MEMBER, EnumSet.of(
                                        WorkspacePermission.VIEW,
                                        WorkspacePermission.VIEW_MEMBERS),

                        WorkspaceRole.VIEWER, EnumSet.of(
                                        WorkspacePermission.VIEW,
                                        WorkspacePermission.VIEW_MEMBERS));

        // ========================= PROJECT =========================

        private static final Map<ProjectMemberRole, Set<ProjectPermission>> PROJECT_POLICY = Map.of(
                        ProjectMemberRole.MANAGER, EnumSet.allOf(ProjectPermission.class),

                        ProjectMemberRole.MEMBER, EnumSet.of(
                                        ProjectPermission.VIEW,
                                        ProjectPermission.VIEW_MEMBERS,
                                        ProjectPermission.VIEW_TAGS,
                                        ProjectPermission.VIEW_SPRINTS,
                                        ProjectPermission.VIEW_TASKS,
                                        ProjectPermission.CREATE_TASK,
                                        ProjectPermission.UPDATE_TASK,
                                        ProjectPermission.DELETE_TASK,
                                        ProjectPermission.UPDATE_TASK_STATUS),

                        ProjectMemberRole.VIEWER, EnumSet.of(
                                        ProjectPermission.VIEW,
                                        ProjectPermission.VIEW_MEMBERS,
                                        ProjectPermission.VIEW_TAGS,
                                        ProjectPermission.VIEW_SPRINTS,
                                        ProjectPermission.VIEW_TASKS));

        // ========================= TASK =========================

        /**
         * Base task permissions theo project role (chưa tính context).
         * Context modifiers (creator, assignee) được xử lý trong
         * EffectivePermissionResolver.
         */
        private static final Map<ProjectMemberRole, Set<TaskPermission>> TASK_BASE_POLICY = Map.of(
                        ProjectMemberRole.MANAGER, EnumSet.allOf(TaskPermission.class),

                        ProjectMemberRole.MEMBER, EnumSet.of(
                                        TaskPermission.VIEW),

                        ProjectMemberRole.VIEWER, EnumSet.of(
                                        TaskPermission.VIEW));

        /**
         * Context-based task permissions.
         * Creator/Assignee sẽ được merge thêm quyền bên dưới.
         */
        private static final Set<TaskPermission> TASK_CREATOR_PERMISSIONS = EnumSet.of(
                        TaskPermission.EDIT,
                        TaskPermission.DELETE);

        private static final Set<TaskPermission> TASK_ASSIGNEE_PERMISSIONS = EnumSet.of(
                        TaskPermission.UPDATE_STATUS);

        // ========================= Query methods =========================

        public boolean hasWorkspacePermission(WorkspaceRole role, WorkspacePermission permission) {
                return WORKSPACE_POLICY.getOrDefault(role, Set.of()).contains(permission);
        }

        public boolean hasProjectPermission(ProjectMemberRole role, ProjectPermission permission) {
                return PROJECT_POLICY.getOrDefault(role, Set.of()).contains(permission);
        }

        public Set<WorkspacePermission> getWorkspacePermissions(WorkspaceRole role) {
                return WORKSPACE_POLICY.getOrDefault(role, Set.of());
        }

        public Set<ProjectPermission> getProjectPermissions(ProjectMemberRole role) {
                return PROJECT_POLICY.getOrDefault(role, Set.of());
        }

        public Set<TaskPermission> getTaskBasePermissions(ProjectMemberRole role) {
                return TASK_BASE_POLICY.getOrDefault(role, Set.of());
        }

        public Set<TaskPermission> getTaskCreatorPermissions() {
                return TASK_CREATOR_PERMISSIONS;
        }

        public Set<TaskPermission> getTaskAssigneePermissions() {
                return TASK_ASSIGNEE_PERMISSIONS;
        }
}
