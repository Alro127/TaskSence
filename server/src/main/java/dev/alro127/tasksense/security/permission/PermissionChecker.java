package dev.alro127.tasksense.security.permission;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;

import java.util.Optional;

import org.springframework.stereotype.Component;

/**
 * Bean dùng cho @PreAuthorize SpEL và service-layer permission checks.
 *
 * Controller usage:
 * @PreAuthorize("@perm.workspace(#workspaceId, 'MANAGE_MEMBERS')")
 * @PreAuthorize("@perm.project(#projectId, 'CREATE_TASK')")
 *
 * Service usage (resource-level):
 * permissionChecker.requireTaskEditPermission(projectId, task);
 */
@Component("perm")
@RequiredArgsConstructor
public class PermissionChecker {

    private final SecurityService securityService;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final PermissionPolicy policy;

    // ==================== @PreAuthorize SpEL methods ====================

    /**
     * Check workspace-level permission.
     * Dùng: @PreAuthorize("@perm.workspace(#workspaceId, 'VIEW')")
     */
    public boolean workspace(Long workspaceId, String permissionName) {
        Long userId = securityService.getCurrentUserId();
        WorkspacePermission permission = WorkspacePermission.valueOf(permissionName);

        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .map(member -> policy.hasWorkspacePermission(member.getRole(), permission))
                .orElse(false);
    }

    /**
     * Check project-level permission.
     * Workspace OWNER có implicit full access cho mọi project.
     * Workspace MANAGER có implicit VIEWER access cho mọi project.
     * Dùng: @PreAuthorize("@perm.project(#projectId, 'CREATE_TASK')")
     */
    public boolean project(Long projectId, String permissionName) {
        Long userId = securityService.getCurrentUserId();
        ProjectPermission permission = ProjectPermission.valueOf(permissionName);

        // 1. Check project-level role
        var projectMember = projectMemberRepository.findByProjectIdAndUserId(projectId, userId);
        if (projectMember.isPresent()) {
            return policy.hasProjectPermission(projectMember.get().getRole(), permission);
        }

        // 2. Fallback: check workspace role for implicit project access
        return hasImplicitProjectPermission(projectId, userId, permission);
    }

    /**
     * Check workspace membership (bất kỳ role nào).
     * Dùng: @PreAuthorize("@perm.workspaceMember(#workspaceId)")
     */
    public boolean workspaceMember(Long workspaceId) {
        Long userId = securityService.getCurrentUserId();
        return workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId);
    }

    // ==================== Service-layer helpers ====================

    /**
     * Lấy project role của current user. Throw nếu không phải member.
     */
    public ProjectMemberRole getProjectRole(Long projectId) {
        Long userId = securityService.getCurrentUserId();
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(ProjectMemberEntity::getRole)
                .orElseThrow(() -> new UnauthorizedException("Not a project member"));
    }

    /**
     * Check current user có phải Project MANAGER hoặc Workspace OWNER không.
     */
    public boolean isProjectManager(Long projectId) {
        Long userId = securityService.getCurrentUserId();
        boolean isManager = projectMemberRepository
                .existsByProjectIdAndUserIdAndRole(projectId, userId, ProjectMemberRole.MANAGER);
        if (isManager)
            return true;
        return isWorkspaceOwnerOfProject(projectId, userId);
    }

    /**
     * Task edit permission:
     * - MANAGER/Workspace OWNER: edit bất kỳ task nào
     * - MEMBER: chỉ edit task mình tạo
     */
    public void requireTaskEditPermission(Long projectId, TaskEntity task) {
        if (isProjectManager(projectId))
            return;

        Long userId = securityService.getCurrentUserId();
        if (!task.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedException("You can only modify tasks you created");
        }
    }

    /**
     * Task status update permission:
     * - MANAGER/Workspace OWNER: update status bất kỳ task nào
     * - MEMBER: update status task mình tạo hoặc được assign
     */
    public void requireTaskStatusPermission(Long projectId, TaskEntity task) {
        if (isProjectManager(projectId))
            return;

        Long userId = securityService.getCurrentUserId();
        boolean isCreator = task.getCreatedBy().getId().equals(userId);
        boolean isAssignee = task.getAssignees().stream()
                .anyMatch(u -> u.getId().equals(userId));

        if (!isCreator && !isAssignee) {
            throw new UnauthorizedException(
                    "You can only update status of tasks you created or are assigned to");
        }
    }

    // ==================== Internal ====================

    private boolean isWorkspaceOwnerOfProject(Long projectId, Long userId) {
        return projectRepository.findById(projectId)
                .flatMap(project -> workspaceMemberRepository.findByWorkspaceIdAndUserId(
                        project.getWorkspace().getId(), userId))
                .map(wsMember -> wsMember.getRole() == WorkspaceRole.OWNER)
                .orElse(false);
    }

    /**
     * Implicit project permission dựa trên workspace role:
     * - OWNER: full project access
     * - MANAGER: VIEWER-level project access
     */
    private boolean hasImplicitProjectPermission(Long projectId, Long userId, ProjectPermission permission) {

        Optional<ProjectEntity> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty())
            return false;

        Long workspaceId = projectOpt.get().getWorkspace().getId();

        Optional<WorkspaceMemberEntity> wsMemberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId,
                userId);

        if (wsMemberOpt.isEmpty())
            return false;

        WorkspaceMemberEntity wsMember = wsMemberOpt.get();

        if (wsMember.getRole() == WorkspaceRole.OWNER) {
            return true;
        }

        if (wsMember.getRole() == WorkspaceRole.MANAGER) {
            return policy.hasProjectPermission(ProjectMemberRole.VIEWER, permission);
        }

        return false;
    }
}
