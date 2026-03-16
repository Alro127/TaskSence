package dev.alro127.tasksense.security.permission;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Trung tâm resolve effective permissions cho current user trên mỗi resource.
 *
 * Mỗi resolve method tổng hợp quyền từ nhiều nguồn:
 * - Direct role (workspace member, project member)
 * - Inherited role (workspace role → implicit project access)
 * - Context (task ownership, assignment)
 *
 * Output luôn là Set<String> để FE dùng trực tiếp, không cần map.
 *
 * Mở rộng cho resource mới:
 * 1. Tạo XxxPermission enum
 * 2. Thêm policy vào PermissionPolicy
 * 3. Thêm resolveXxx() method ở đây
 * 4. Thêm field permissions vào Response DTO
 */
@Component
@RequiredArgsConstructor
public class EffectivePermissionResolver {

    private final PermissionPolicy policy;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;

    // ========================= WORKSPACE =========================

    /**
     * Resolve effective workspace permissions cho user.
     * Cache key: userId + workspaceId. TTL 5 phút (xem CacheConfig).
     */
    @Cacheable(value = "permissions", key = "'ws:' + #userId + ':' + #workspaceId")
    public Set<String> resolveWorkspacePermissions(Long userId, Long workspaceId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .map(member -> toStringSet(policy.getWorkspacePermissions(member.getRole())))
                .orElse(Set.of());
    }

    // ========================= PROJECT =========================

    /**
     * Resolve effective project permissions cho user.
     * Xét cả direct project role và inherited workspace role.
     * Cache key: userId + projectId. TTL 5 phút (xem CacheConfig).
     */
    @Cacheable(value = "permissions", key = "'proj:' + #userId + ':' + #projectId")
    public Set<String> resolveProjectPermissions(Long userId, Long projectId) {
        // 1. Direct project role
        var projectMember = projectMemberRepository.findByProjectIdAndUserId(projectId, userId);
        if (projectMember.isPresent()) {
            return toStringSet(policy.getProjectPermissions(projectMember.get().getRole()));
        }

        // 2. Inherited from workspace role
        return resolveInheritedProjectPermissions(userId, projectId);
    }

    /**
     * Resolve effective project role cho user (xét cả workspace inheritance).
     * Trả null nếu user không có quyền gì trên project.
     */
    public ProjectMemberRole resolveEffectiveProjectRole(Long userId, Long projectId) {
        // 1. Direct project role
        var projectMember = projectMemberRepository.findByProjectIdAndUserId(projectId, userId);
        if (projectMember.isPresent()) {
            return projectMember.get().getRole();
        }

        // 2. Inherited from workspace role
        Optional<ProjectEntity> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) return null;

        Long workspaceId = projectOpt.get().getWorkspace().getId();
        Optional<WorkspaceMemberEntity> wsMemberOpt =
                workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId);

        if (wsMemberOpt.isEmpty()) return null;

        WorkspaceRole wsRole = wsMemberOpt.get().getRole();
        if (wsRole == WorkspaceRole.OWNER) return ProjectMemberRole.MANAGER;
        if (wsRole == WorkspaceRole.MANAGER) return ProjectMemberRole.VIEWER;

        return null;
    }

    // ========================= TASK =========================

    /**
     * Resolve effective task permissions cho user trên một task cụ thể.
     * Tổng hợp: base role permissions + context (creator, assignee).
     */
    public Set<String> resolveTaskPermissions(Long userId, Long projectId, TaskEntity task) {
        ProjectMemberRole effectiveRole = resolveEffectiveProjectRole(userId, projectId);
        if (effectiveRole == null) {
            return Set.of();
        }

        EnumSet<TaskPermission> permissions = EnumSet.copyOf(policy.getTaskBasePermissions(effectiveRole));

        // Context modifiers — chỉ áp dụng cho non-MANAGER (MANAGER đã có all)
        if (effectiveRole != ProjectMemberRole.MANAGER) {
            boolean isCreator = task.getCreatedBy() != null
                    && task.getCreatedBy().getId().equals(userId);
            boolean isAssignee = task.getAssignees().stream()
                    .anyMatch(u -> u.getId().equals(userId));

            if (isCreator) {
                permissions.addAll(policy.getTaskCreatorPermissions());
            }
            if (isAssignee) {
                permissions.addAll(policy.getTaskAssigneePermissions());
            }
        }

        return toStringSet(permissions);
    }

    // ========================= Cache eviction =========================

    /**
     * Evict toàn bộ permission cache.
     * Gọi khi membership/role thay đổi.
     */
    @CacheEvict(value = "permissions", allEntries = true)
    public void evictAllPermissionCache() {
        // Spring AOP handles eviction
    }

    // ========================= Internal =========================

    private Set<String> resolveInheritedProjectPermissions(Long userId, Long projectId) {
        Optional<ProjectEntity> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) return Set.of();

        Long workspaceId = projectOpt.get().getWorkspace().getId();
        Optional<WorkspaceMemberEntity> wsMemberOpt =
                workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId);

        if (wsMemberOpt.isEmpty()) return Set.of();

        WorkspaceRole wsRole = wsMemberOpt.get().getRole();

        if (wsRole == WorkspaceRole.OWNER) {
            return toStringSet(policy.getProjectPermissions(ProjectMemberRole.MANAGER));
        }
        if (wsRole == WorkspaceRole.MANAGER) {
            return toStringSet(policy.getProjectPermissions(ProjectMemberRole.VIEWER));
        }

        return Set.of();
    }

    private <E extends Enum<E>> Set<String> toStringSet(Set<E> enums) {
        return enums.stream().map(Enum::name).collect(Collectors.toUnmodifiableSet());
    }
}
