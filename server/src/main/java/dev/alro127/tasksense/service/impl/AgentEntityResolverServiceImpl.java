package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.dto.agent.AgentResolutionResponse;
import dev.alro127.tasksense.dto.agent.AgentResolutionStatus;
import dev.alro127.tasksense.dto.agent.AgentResolvedProject;
import dev.alro127.tasksense.dto.agent.AgentResolvedTask;
import dev.alro127.tasksense.dto.agent.AgentResolvedWorkspace;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.security.permission.EffectivePermissionResolver;
import dev.alro127.tasksense.security.permission.PermissionPolicy;
import dev.alro127.tasksense.security.permission.ProjectPermission;
import dev.alro127.tasksense.security.permission.WorkspacePermission;
import dev.alro127.tasksense.service.AgentEntityResolverService;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AgentEntityResolverServiceImpl implements AgentEntityResolverService {

    private static final int CANDIDATE_LIMIT = 5;

    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final SecurityService securityService;
    private final PermissionPolicy permissionPolicy;
    private final EffectivePermissionResolver permissionResolver;

    @Override
    public AgentResolutionResponse<AgentResolvedWorkspace> resolveWorkspace(
            Long workspaceId,
            String workspaceName,
            WorkspacePermission requiredPermission) {
        Long userId = securityService.getCurrentUserId();
        WorkspacePermission permission = requiredPermission != null ? requiredPermission : WorkspacePermission.VIEW;

        if (workspaceId != null) {
            return workspaceRepository.findById(workspaceId)
                    .map(workspace -> {
                        Set<String> permissions = permissionResolver.resolveWorkspacePermissions(userId,
                                workspace.getId());
                        if (!permissions.contains(permission.name())) {
                            return workspaceForbidden();
                        }
                        return resolvedWorkspace(toWorkspace(workspace, permissions));
                    })
                    .orElseGet(() -> workspaceNotFound("Workspace not found or not authorized"));
        }

        Collection<WorkspaceRole> allowedRoles = workspaceRolesWith(permission);
        if (allowedRoles.isEmpty()) {
            return workspaceForbidden();
        }

        String name = trimToNull(workspaceName);
        List<WorkspaceEntity> exact = workspaceRepository.findAuthorizedExactName(
                userId, allowedRoles, name, PageRequest.of(0, CANDIDATE_LIMIT));
        if (exact.size() == 1) {
            WorkspaceEntity workspace = exact.getFirst();
            return resolvedWorkspace(toWorkspace(
                    workspace,
                    permissionResolver.resolveWorkspacePermissions(userId, workspace.getId())));
        }
        if (exact.size() > 1) {
            return ambiguousWorkspaces(exact, userId);
        }

        List<WorkspaceEntity> partial = workspaceRepository.findAuthorizedNameLike(
                userId, allowedRoles, name, PageRequest.of(0, CANDIDATE_LIMIT));
        if (partial.size() == 1) {
            WorkspaceEntity workspace = partial.getFirst();
            return resolvedWorkspace(toWorkspace(
                    workspace,
                    permissionResolver.resolveWorkspacePermissions(userId, workspace.getId())));
        }
        if (partial.size() > 1) {
            return ambiguousWorkspaces(partial, userId);
        }
        return workspaceNotFound("Workspace not found or not authorized");
    }

    @Override
    public AgentResolutionResponse<AgentResolvedProject> resolveProject(
            Long projectId,
            String projectName,
            Long workspaceId,
            String workspaceName,
            ProjectPermission requiredPermission) {
        Long userId = securityService.getCurrentUserId();
        ProjectPermission permission = requiredPermission != null ? requiredPermission : ProjectPermission.VIEW;

        if (projectId != null) {
            return projectRepository.findById(projectId)
                    .map(project -> {
                        Set<String> permissions = permissionResolver.resolveProjectPermissions(userId, project.getId());
                        if (!permissions.contains(permission.name())) {
                            return projectForbidden();
                        }
                        return resolvedProject(toProject(project, permissions));
                    })
                    .orElseGet(() -> projectNotFound("Project not found or not authorized"));
        }

        Collection<ProjectMemberRole> allowedProjectRoles = projectRolesWith(permission);
        Collection<WorkspaceRole> allowedInheritedRoles = inheritedWorkspaceRolesWith(permission);
        if (allowedProjectRoles.isEmpty() && allowedInheritedRoles.isEmpty()) {
            return projectForbidden();
        }

        String normalizedProjectName = trimToNull(projectName);
        String normalizedWorkspaceName = trimToNull(workspaceName);
        List<ProjectEntity> exact = projectRepository.findAuthorizedExactName(
                userId,
                normalizedProjectName,
                workspaceId,
                normalizedWorkspaceName,
                allowedProjectRoles,
                allowedInheritedRoles,
                PageRequest.of(0, CANDIDATE_LIMIT));
        if (exact.size() == 1) {
            ProjectEntity project = exact.getFirst();
            return resolvedProject(toProject(
                    project,
                    permissionResolver.resolveProjectPermissions(userId, project.getId())));
        }
        if (exact.size() > 1) {
            return ambiguousProjects(exact, userId);
        }

        List<ProjectEntity> partial = projectRepository.findAuthorizedNameLike(
                userId,
                normalizedProjectName,
                workspaceId,
                normalizedWorkspaceName,
                allowedProjectRoles,
                allowedInheritedRoles,
                PageRequest.of(0, CANDIDATE_LIMIT));
        if (partial.size() == 1) {
            ProjectEntity project = partial.getFirst();
            return resolvedProject(toProject(
                    project,
                    permissionResolver.resolveProjectPermissions(userId, project.getId())));
        }
        if (partial.size() > 1) {
            return ambiguousProjects(partial, userId);
        }
        return projectNotFound("Project not found or not authorized");
    }

    @Override
    public AgentResolutionResponse<AgentResolvedTask> resolveTask(
            Long taskId,
            String taskTitle,
            Long projectId,
            String projectName,
            Long workspaceId,
            String workspaceName,
            ProjectPermission requiredProjectPermission) {
        ProjectPermission permission = requiredProjectPermission != null
                ? requiredProjectPermission
                : ProjectPermission.VIEW_TASKS;
        Long userId = securityService.getCurrentUserId();

        if (taskId != null && projectId != null) {
            AgentResolutionResponse<AgentResolvedProject> projectResolution = resolveProject(
                    projectId, null, null, null, permission);
            if (!projectResolution.isResolved()) {
                return taskNotFound("Task not found or not authorized");
            }
            return taskRepository.findByIdAndProjectId(taskId, projectId)
                    .map(task -> resolvedTask(
                            toTask(task, permissionResolver.resolveTaskPermissions(userId, projectId, task))))
                    .orElseGet(() -> taskNotFound("Task not found or not authorized"));
        }

        AgentResolutionResponse<AgentResolvedProject> projectResolution = resolveProject(
                projectId, projectName, workspaceId, workspaceName, permission);
        if (!projectResolution.isResolved()) {
            return AgentResolutionResponse.<AgentResolvedTask>builder()
                    .status(projectResolution.getStatus())
                    .message(projectResolution.getMessage())
                    .candidates(List.of())
                    .build();
        }

        Long resolvedProjectId = projectResolution.getSelected().getProjectId();
        if (taskId != null) {
            return taskRepository.findByIdAndProjectId(taskId, resolvedProjectId)
                    .map(task -> resolvedTask(
                            toTask(task, permissionResolver.resolveTaskPermissions(userId, resolvedProjectId, task))))
                    .orElseGet(() -> taskNotFound("Task not found or not authorized"));
        }

        String normalizedTitle = trimToNull(taskTitle);
        if (normalizedTitle == null) {
            return taskNotFound("Task title or taskId is required");
        }

        List<TaskEntity> exact = taskRepository.findByProjectIdAndTitleExact(
                resolvedProjectId, normalizedTitle, PageRequest.of(0, CANDIDATE_LIMIT));
        if (exact.size() == 1) {
            TaskEntity task = exact.getFirst();
            return resolvedTask(
                    toTask(task, permissionResolver.resolveTaskPermissions(userId, resolvedProjectId, task)));
        }
        if (exact.size() > 1) {
            return ambiguousTasks(exact, userId, resolvedProjectId);
        }

        List<TaskEntity> partial = taskRepository.findByProjectIdAndTitleLike(
                resolvedProjectId, normalizedTitle, PageRequest.of(0, CANDIDATE_LIMIT));
        if (partial.size() == 1) {
            TaskEntity task = partial.getFirst();
            return resolvedTask(
                    toTask(task, permissionResolver.resolveTaskPermissions(userId, resolvedProjectId, task)));
        }
        if (partial.size() > 1) {
            return ambiguousTasks(partial, userId, resolvedProjectId);
        }
        return taskNotFound("Task not found or not authorized");
    }

    private Collection<WorkspaceRole> workspaceRolesWith(WorkspacePermission permission) {
        return Arrays.stream(WorkspaceRole.values())
                .filter(role -> permissionPolicy.hasWorkspacePermission(role, permission))
                .toList();
    }

    private Collection<ProjectMemberRole> projectRolesWith(ProjectPermission permission) {
        return Arrays.stream(ProjectMemberRole.values())
                .filter(role -> permissionPolicy.hasProjectPermission(role, permission))
                .toList();
    }

    private Collection<WorkspaceRole> inheritedWorkspaceRolesWith(ProjectPermission permission) {
        return Arrays.stream(WorkspaceRole.values())
                .filter(role -> {
                    ProjectMemberRole inherited = inheritedProjectRole(role);
                    return inherited != null && permissionPolicy.hasProjectPermission(inherited, permission);
                })
                .toList();
    }

    private ProjectMemberRole inheritedProjectRole(WorkspaceRole role) {
        if (role == WorkspaceRole.OWNER) {
            return ProjectMemberRole.MANAGER;
        }
        if (role == WorkspaceRole.MANAGER) {
            return ProjectMemberRole.VIEWER;
        }
        return null;
    }

    private AgentResolvedWorkspace toWorkspace(WorkspaceEntity workspace, Set<String> permissions) {
        return AgentResolvedWorkspace.builder()
                .workspaceId(workspace.getId())
                .workspaceName(workspace.getName())
                .permissions(permissions)
                .build();
    }

    private AgentResolvedProject toProject(ProjectEntity project, Set<String> permissions) {
        return AgentResolvedProject.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .workspaceId(project.getWorkspace().getId())
                .workspaceName(project.getWorkspace().getName())
                .permissions(permissions)
                .build();
    }

    private AgentResolvedTask toTask(TaskEntity task, Set<String> permissions) {
        ProjectEntity project = task.getProject();
        WorkspaceEntity workspace = project.getWorkspace();
        return AgentResolvedTask.builder()
                .taskId(task.getId())
                .taskTitle(task.getTitle())
                .projectId(project.getId())
                .projectName(project.getName())
                .workspaceId(workspace.getId())
                .workspaceName(workspace.getName())
                .permissions(permissions)
                .build();
    }

    private AgentResolutionResponse<AgentResolvedWorkspace> resolvedWorkspace(AgentResolvedWorkspace workspace) {
        return AgentResolutionResponse.<AgentResolvedWorkspace>builder()
                .status(AgentResolutionStatus.RESOLVED)
                .message("Workspace resolved")
                .selected(workspace)
                .candidates(List.of())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedProject> resolvedProject(AgentResolvedProject project) {
        return AgentResolutionResponse.<AgentResolvedProject>builder()
                .status(AgentResolutionStatus.RESOLVED)
                .message("Project resolved")
                .selected(project)
                .candidates(List.of())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedTask> resolvedTask(AgentResolvedTask task) {
        return AgentResolutionResponse.<AgentResolvedTask>builder()
                .status(AgentResolutionStatus.RESOLVED)
                .message("Task resolved")
                .selected(task)
                .candidates(List.of())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedWorkspace> ambiguousWorkspaces(List<WorkspaceEntity> workspaces,
            Long userId) {
        return AgentResolutionResponse.<AgentResolvedWorkspace>builder()
                .status(AgentResolutionStatus.AMBIGUOUS)
                .message("Multiple authorized workspaces match")
                .candidates(workspaces.stream()
                        .map(workspace -> toWorkspace(
                                workspace,
                                permissionResolver.resolveWorkspacePermissions(userId, workspace.getId())))
                        .toList())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedProject> ambiguousProjects(List<ProjectEntity> projects, Long userId) {
        return AgentResolutionResponse.<AgentResolvedProject>builder()
                .status(AgentResolutionStatus.AMBIGUOUS)
                .message("Multiple authorized projects match")
                .candidates(projects.stream()
                        .map(project -> toProject(
                                project,
                                permissionResolver.resolveProjectPermissions(userId, project.getId())))
                        .toList())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedTask> ambiguousTasks(List<TaskEntity> tasks, Long userId,
            Long projectId) {
        return AgentResolutionResponse.<AgentResolvedTask>builder()
                .status(AgentResolutionStatus.AMBIGUOUS)
                .message("Multiple authorized tasks match")
                .candidates(tasks.stream()
                        .map(task -> toTask(task, permissionResolver.resolveTaskPermissions(userId, projectId, task)))
                        .toList())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedWorkspace> workspaceNotFound(String message) {
        return AgentResolutionResponse.<AgentResolvedWorkspace>builder()
                .status(AgentResolutionStatus.NOT_FOUND)
                .message(message)
                .candidates(List.of())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedProject> projectNotFound(String message) {
        return AgentResolutionResponse.<AgentResolvedProject>builder()
                .status(AgentResolutionStatus.NOT_FOUND)
                .message(message)
                .candidates(List.of())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedTask> taskNotFound(String message) {
        return AgentResolutionResponse.<AgentResolvedTask>builder()
                .status(AgentResolutionStatus.NOT_FOUND)
                .message(message)
                .candidates(List.of())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedWorkspace> workspaceForbidden() {
        return AgentResolutionResponse.<AgentResolvedWorkspace>builder()
                .status(AgentResolutionStatus.FORBIDDEN)
                .message("Workspace not found or not authorized")
                .candidates(List.of())
                .build();
    }

    private AgentResolutionResponse<AgentResolvedProject> projectForbidden() {
        return AgentResolutionResponse.<AgentResolvedProject>builder()
                .status(AgentResolutionStatus.FORBIDDEN)
                .message("Project not found or not authorized")
                .candidates(List.of())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
