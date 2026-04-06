package dev.alro127.tasksense.security.permission;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.WorkflowRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;

import java.util.Set;

import org.springframework.stereotype.Component;

/**
 * Bean dùng cho @PreAuthorize SpEL và service-layer permission checks.
 * Delegate sang EffectivePermissionResolver cho mọi logic resolve.
 *
 * Controller usage:
 * @PreAuthorize("@perm.workspace(#workspaceId, 'MANAGE_MEMBERS')")
 * @PreAuthorize("@perm.project(#projectId, 'CREATE_TASK')")
 *
 * Service usage (resource-level):
 * permissionChecker.requireTaskPermission(projectId, task,
 * TaskPermission.EDIT);
 */
@Component("perm")
@RequiredArgsConstructor
public class PermissionChecker {

    private final SecurityService securityService;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkflowRepository workflowRepository;
    private final EffectivePermissionResolver resolver;

    // ==================== @PreAuthorize SpEL methods ====================

    /**
     * Check workspace-level permission.
     * Dùng: @PreAuthorize("@perm.workspace(#workspaceId, 'VIEW')")
     */
    public boolean workspace(Long workspaceId, String permissionName) {
        Long userId = securityService.getCurrentUserId();
        Set<String> permissions = resolver.resolveWorkspacePermissions(userId, workspaceId);
        return permissions.contains(permissionName);
    }

    /**
     * Check project-level permission (xét cả workspace inheritance).
     * Dùng: @PreAuthorize("@perm.project(#projectId, 'CREATE_TASK')")
     */
    public boolean project(Long projectId, String permissionName) {
        Long userId = securityService.getCurrentUserId();
        Set<String> permissions = resolver.resolveProjectPermissions(userId, projectId);
        return permissions.contains(permissionName);
    }

    /**
     * Check workspace membership (bất kỳ role nào).
     * Dùng: @PreAuthorize("@perm.workspaceMember(#workspaceId)")
     */
    public boolean workspaceMember(Long workspaceId) {
        Long userId = securityService.getCurrentUserId();
        return workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId);
    }

    /**
     * Check current request is authenticated.
     * Dùng: @PreAuthorize("@perm.authenticated()")
     */
    public boolean authenticated() {
        try {
            return securityService.getCurrentUserId() != null;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    /**
     * Check ownership of a workflow.
     * Dùng: @PreAuthorize("@perm.workflowOwner(#workflowId)")
     */
    public boolean workflowOwner(Long workflowId) {
        Long userId = securityService.getCurrentUserId();
        return workflowRepository.findByIdAndCreatedById(workflowId, userId).isPresent();
    }

    // ==================== Service-layer helpers ====================

    /**
     * Lấy effective project role của current user (xét cả workspace inheritance).
     * Throw nếu không có quyền gì.
     */
    public ProjectMemberRole getProjectRole(Long projectId) {
        Long userId = securityService.getCurrentUserId();
        ProjectMemberRole role = resolver.resolveEffectiveProjectRole(userId, projectId);
        if (role == null) {
            throw new UnauthorizedException("Not a project member");
        }
        return role;
    }

    /**
     * Check current user có effective MANAGER role trên project không.
     */
    public boolean isProjectManager(Long projectId) {
        Long userId = securityService.getCurrentUserId();
        ProjectMemberRole role = resolver.resolveEffectiveProjectRole(userId, projectId);
        return role == ProjectMemberRole.MANAGER;
    }

    /**
     * Require project-level permission for current user.
     * Dùng trong service khi controller không có projectId để @PreAuthorize trực
     * tiếp.
     */
    public void requireProjectPermission(Long projectId, ProjectPermission required) {
        Long userId = securityService.getCurrentUserId();
        Set<String> permissions = resolver.resolveProjectPermissions(userId, projectId);
        if (!permissions.contains(required.name())) {
            throw new UnauthorizedException(
                    "You do not have " + required.name() + " permission on this project");
        }
    }

    /**
     * Require task-level permission.
     * Dùng cho service-layer resource-level checks.
     *
     * Ví dụ:
     * requireTaskPermission(projectId, task, TaskPermission.EDIT);
     * requireTaskPermission(projectId, task, TaskPermission.UPDATE_STATUS);
     */
    public void requireTaskPermission(Long projectId, TaskEntity task, TaskPermission required) {
        Long userId = securityService.getCurrentUserId();
        Set<String> permissions = resolver.resolveTaskPermissions(userId, projectId, task);
        if (!permissions.contains(required.name())) {
            throw new UnauthorizedException(
                    "You do not have " + required.name() + " permission on this task");
        }
    }
}
