package dev.alro127.tasksense.mcp;

import dev.alro127.tasksense.domain.enums.ProjectStatus;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.agent.AgentProjectWithTasksResponse;
import dev.alro127.tasksense.dto.agent.AgentConfirmationRequiredResponse;
import dev.alro127.tasksense.dto.agent.AgentResolutionResponse;
import dev.alro127.tasksense.dto.agent.AgentResolutionStatus;
import dev.alro127.tasksense.dto.agent.AgentResolvedProject;
import dev.alro127.tasksense.dto.agent.AgentResolvedTask;
import dev.alro127.tasksense.dto.agent.AgentResolvedWorkspace;
import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.CreateWorkflowFromProjectRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskStatusRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.dto.response.TaskResponse;
import dev.alro127.tasksense.dto.response.WorkflowDraftResponse;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.security.permission.PermissionChecker;
import dev.alro127.tasksense.security.permission.ProjectPermission;
import dev.alro127.tasksense.security.permission.WorkspacePermission;
import dev.alro127.tasksense.service.ProjectService;
import dev.alro127.tasksense.service.TaskService;
import dev.alro127.tasksense.service.WorkspaceService;
import dev.alro127.tasksense.service.WorkflowService;
import dev.alro127.tasksense.service.AgentEntityResolverService;
import dev.alro127.tasksense.service.AgentConfirmationService;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskSenseMcpTools {

    private final PermissionChecker permissionChecker;
    private final TaskService taskService;
    private final ProjectService projectService;
    private final WorkspaceService workspaceService;
    private final WorkflowService workflowService;
    private final AgentEntityResolverService agentEntityResolverService;
    private final AgentConfirmationService agentConfirmationService;

    @Tool(name = "create_task", description = "Create a task inside an authorized TaskSense project.")
    public TaskResponse createTask(@ToolParam(description = "create_task request") CreateTaskToolRequest toolRequest) {
        Long projectId = requireId(toolRequest.getProjectId(), "projectId is required for create_task");
        permissionChecker.requireProjectPermission(projectId, ProjectPermission.CREATE_TASK);

        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle(requireNonBlank(toolRequest.getTitle(), "title is required for create_task"));
        request.setDescription(trimToNull(toolRequest.getDescription()));
        request.setPriority(toolRequest.getPriority() != null ? toolRequest.getPriority() : TaskPriority.MEDIUM);
        request.setStatus(toolRequest.getStatus() != null ? toolRequest.getStatus() : TaskStatus.TODO);
        request.setStartDate(toolRequest.getStartDate());
        request.setDueDate(toolRequest.getDueDate());
        request.setParentTaskId(toolRequest.getParentTaskId());
        request.setSprintId(toolRequest.getSprintId());
        request.setTagIds(toolRequest.getTagIds());
        request.setAssigneeIds(toolRequest.getAssigneeIds());

        TaskResponse result = taskService.createTask(projectId, request);
        log.info("[mcp-tool] create_task projectId={} taskId={}", projectId, result.getId());
        return result;
    }

    @Tool(name = "create_project", description = "Create a project inside an authorized TaskSense workspace.")
    public ProjectResponse createProject(@ToolParam(description = "create_project request") CreateProjectToolRequest toolRequest) {
        Long workspaceId = requireId(toolRequest.getWorkspaceId(), "workspaceId is required for create_project");
        if (!permissionChecker.workspace(workspaceId, WorkspacePermission.CREATE_PROJECT.name())) {
            throw new UnauthorizedException("You do not have CREATE_PROJECT permission on this workspace");
        }

        CreateProjectRequest request = new CreateProjectRequest();
        request.setName(requireNonBlank(toolRequest.getName(), "name is required for create_project"));
        request.setDescription(trimToNull(toolRequest.getDescription()));
        request.setStatus(toolRequest.getStatus());
        request.setStartDate(toolRequest.getStartDate());
        request.setEndDate(toolRequest.getEndDate());

        ProjectResponse result = projectService.createProject(workspaceId, request);
        log.info("[mcp-tool] create_project workspaceId={} projectId={}", workspaceId, result.getId());
        return result;
    }

    @Tool(name = "create_workspace", description = "Create a new TaskSense workspace for the authenticated user.")
    public WorkspaceResponse createWorkspace(@ToolParam(description = "create_workspace request") CreateWorkspaceToolRequest toolRequest) {
        CreateWorkspaceRequest request = new CreateWorkspaceRequest();
        request.setName(requireNonBlank(toolRequest.getName(), "name is required for create_workspace"));
        request.setDescription(trimToNull(toolRequest.getDescription()));
        request.setIsPublic(toolRequest.getIsPublic());

        WorkspaceResponse result = workspaceService.createWorkspace(request);
        log.info("[mcp-tool] create_workspace workspaceId={}", result.getId());
        return result;
    }

    @Tool(name = "create_workflow_from_project", description = "Create a workflow draft from an existing authorized TaskSense project using the current stable workflow logic.")
    public WorkflowDraftResponse createWorkflowFromProject(@ToolParam(description = "create_workflow_from_project request") CreateWorkflowFromProjectToolRequest toolRequest) {
        Long projectId = requireId(toolRequest.getProjectId(), "projectId is required for create_workflow_from_project");
        permissionChecker.requireProjectPermission(projectId, ProjectPermission.VIEW_TASKS);

        CreateWorkflowFromProjectRequest request = new CreateWorkflowFromProjectRequest();
        request.setIncludeSubtasks(toolRequest.getIncludeSubtasks());
        request.setIncludeCompletedTasks(toolRequest.getIncludeCompletedTasks());
        request.setUseAiRefinement(toolRequest.getUseAiRefinement());

        WorkflowDraftResponse result = workflowService.createWorkflowFromProject(projectId, request);
        log.info("[mcp-tool] create_workflow_from_project projectId={} workflowId={}", projectId, result.getId());
        return result;
    }

    @Tool(name = "update_task_status", description = "Update a task status inside an authorized TaskSense project.")
    public TaskResponse updateTaskStatus(@ToolParam(description = "update_task_status request") UpdateTaskStatusToolRequest toolRequest) {
        Long projectId = requireId(toolRequest.getProjectId(), "projectId is required for update_task_status");
        Long taskId = requireId(toolRequest.getTaskId(), "taskId is required for update_task_status");
        permissionChecker.requireProjectPermission(projectId, ProjectPermission.UPDATE_TASK_STATUS);

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest();
        if (toolRequest.getStatus() == null) {
            throw new BadRequestException("status is required for update_task_status");
        }
        request.setStatus(toolRequest.getStatus());

        TaskResponse result = taskService.updateTaskStatus(projectId, taskId, request);
        log.info("[mcp-tool] update_task_status projectId={} taskId={} status={}", projectId, taskId, result.getStatus());
        return result;
    }

    @Tool(name = "resolve_workspace", description = "Resolve an authorized TaskSense workspace by id or name for a required workspace permission.")
    public AgentResolutionResponse<AgentResolvedWorkspace> resolveWorkspace(@ToolParam(description = "resolve_workspace request") ResolveWorkspaceToolRequest toolRequest) {
        WorkspacePermission permission = toolRequest.getRequiredPermission() != null
                ? toolRequest.getRequiredPermission()
                : WorkspacePermission.VIEW;
        return agentEntityResolverService.resolveWorkspace(
                toolRequest.getWorkspaceId(),
                toolRequest.getWorkspaceName(),
                permission);
    }

    @Tool(name = "resolve_project", description = "Resolve an authorized TaskSense project by id, name, and optional workspace context for a required project permission.")
    public AgentResolutionResponse<AgentResolvedProject> resolveProject(@ToolParam(description = "resolve_project request") ResolveProjectToolRequest toolRequest) {
        ProjectPermission permission = toolRequest.getRequiredPermission() != null
                ? toolRequest.getRequiredPermission()
                : ProjectPermission.VIEW;
        return agentEntityResolverService.resolveProject(
                toolRequest.getProjectId(),
                toolRequest.getProjectName(),
                toolRequest.getWorkspaceId(),
                toolRequest.getWorkspaceName(),
                permission);
    }

    @Tool(name = "resolve_task", description = "Resolve an authorized TaskSense task by id or title with project/workspace context.")
    public AgentResolutionResponse<AgentResolvedTask> resolveTask(@ToolParam(description = "resolve_task request") ResolveTaskToolRequest toolRequest) {
        ProjectPermission permission = toolRequest.getRequiredProjectPermission() != null
                ? toolRequest.getRequiredProjectPermission()
                : ProjectPermission.VIEW_TASKS;
        return agentEntityResolverService.resolveTask(
                toolRequest.getTaskId(),
                toolRequest.getTaskTitle(),
                toolRequest.getProjectId(),
                toolRequest.getProjectName(),
                toolRequest.getWorkspaceId(),
                toolRequest.getWorkspaceName(),
                permission);
    }

    @Tool(name = "create_task_natural", description = "Create a task by resolving project/workspace names when projectId is not provided.")
    public Object createTaskNatural(@ToolParam(description = "create_task_natural request") CreateTaskNaturalToolRequest toolRequest) {
        Long projectId = toolRequest.getProjectId();
        if (projectId == null) {
            AgentResolutionResponse<AgentResolvedProject> resolution = agentEntityResolverService.resolveProject(
                    null,
                    toolRequest.getProjectName(),
                    toolRequest.getWorkspaceId(),
                    toolRequest.getWorkspaceName(),
                    ProjectPermission.CREATE_TASK);
            if (!resolution.isResolved()) {
                return resolution;
            }
            projectId = resolution.getSelected().getProjectId();
        }

        CreateTaskToolRequest request = new CreateTaskToolRequest();
        request.setProjectId(projectId);
        request.setTitle(toolRequest.getTitle());
        request.setDescription(toolRequest.getDescription());
        request.setPriority(toolRequest.getPriority() != null ? toolRequest.getPriority() : TaskPriority.MEDIUM);
        request.setStatus(toolRequest.getStatus() != null ? toolRequest.getStatus() : TaskStatus.TODO);
        request.setStartDate(toolRequest.getStartDate());
        request.setDueDate(toolRequest.getDueDate());
        request.setParentTaskId(toolRequest.getParentTaskId());
        request.setSprintId(toolRequest.getSprintId());
        request.setTagIds(toolRequest.getTagIds());
        request.setAssigneeIds(toolRequest.getAssigneeIds());
        return createTask(request);
    }

    @Tool(name = "create_project_natural", description = "Create a project by resolving the target workspace from id or name.")
    public Object createProjectNatural(@ToolParam(description = "create_project_natural request") CreateProjectNaturalToolRequest toolRequest) {
        Long workspaceId = resolveWorkspaceForCreateProject(toolRequest.getWorkspaceId(), toolRequest.getWorkspaceName());
        if (workspaceId == null) {
            return agentEntityResolverService.resolveWorkspace(
                    null,
                    toolRequest.getWorkspaceName(),
                    WorkspacePermission.CREATE_PROJECT);
        }

        CreateProjectToolRequest request = new CreateProjectToolRequest();
        request.setWorkspaceId(workspaceId);
        request.setName(toolRequest.getName());
        request.setDescription(toolRequest.getDescription());
        request.setStatus(toolRequest.getStatus());
        request.setStartDate(toolRequest.getStartDate());
        request.setEndDate(toolRequest.getEndDate());
        return createProject(request);
    }

    @Tool(name = "create_project_with_tasks", description = "Create a project and initial tasks from a free-form project plan. Maximum 20 tasks.")
    @Transactional
    public Object createProjectWithTasks(@ToolParam(description = "create_project_with_tasks request") CreateProjectWithTasksToolRequest toolRequest) {
        Long workspaceId = resolveWorkspaceForCreateProject(toolRequest.getWorkspaceId(), toolRequest.getWorkspaceName());
        if (workspaceId == null) {
            return agentEntityResolverService.resolveWorkspace(
                    null,
                    toolRequest.getWorkspaceName(),
                    WorkspacePermission.CREATE_PROJECT);
        }

        List<CreateTaskNaturalToolRequest> tasks = toolRequest.getTasks() != null ? toolRequest.getTasks() : List.of();
        if (tasks.size() > 20) {
            throw new BadRequestException("create_project_with_tasks supports at most 20 tasks");
        }

        CreateProjectToolRequest projectRequest = new CreateProjectToolRequest();
        projectRequest.setWorkspaceId(workspaceId);
        projectRequest.setName(toolRequest.getName());
        projectRequest.setDescription(toolRequest.getDescription());
        projectRequest.setStatus(toolRequest.getStatus());
        projectRequest.setStartDate(toolRequest.getStartDate());
        projectRequest.setEndDate(toolRequest.getEndDate());
        ProjectResponse project = createProject(projectRequest);

        List<TaskResponse> createdTasks = new ArrayList<>();
        for (CreateTaskNaturalToolRequest task : tasks) {
            CreateTaskToolRequest taskRequest = new CreateTaskToolRequest();
            taskRequest.setProjectId(project.getId());
            taskRequest.setTitle(task.getTitle());
            taskRequest.setDescription(task.getDescription());
            taskRequest.setPriority(task.getPriority() != null ? task.getPriority() : TaskPriority.MEDIUM);
            taskRequest.setStatus(task.getStatus() != null ? task.getStatus() : TaskStatus.TODO);
            taskRequest.setStartDate(task.getStartDate());
            taskRequest.setDueDate(task.getDueDate());
            createdTasks.add(createTask(taskRequest));
        }

        return AgentProjectWithTasksResponse.builder()
                .project(project)
                .tasks(createdTasks)
                .build();
    }

    @Tool(name = "create_workflow_from_project_natural", description = "Create a workflow draft by resolving project/workspace names when projectId is not provided.")
    public Object createWorkflowFromProjectNatural(@ToolParam(description = "create_workflow_from_project_natural request") CreateWorkflowFromProjectNaturalToolRequest toolRequest) {
        Long projectId = toolRequest.getProjectId();
        if (projectId == null) {
            AgentResolutionResponse<AgentResolvedProject> resolution = agentEntityResolverService.resolveProject(
                    null,
                    toolRequest.getProjectName(),
                    toolRequest.getWorkspaceId(),
                    toolRequest.getWorkspaceName(),
                    ProjectPermission.VIEW_TASKS);
            if (!resolution.isResolved()) {
                return resolution;
            }
            projectId = resolution.getSelected().getProjectId();
        }

        CreateWorkflowFromProjectToolRequest request = new CreateWorkflowFromProjectToolRequest();
        request.setProjectId(projectId);
        request.setIncludeSubtasks(toolRequest.getIncludeSubtasks());
        request.setIncludeCompletedTasks(toolRequest.getIncludeCompletedTasks());
        request.setUseAiRefinement(toolRequest.getUseAiRefinement());
        return createWorkflowFromProject(request);
    }

    @Tool(name = "update_task_natural", description = "Preview or update a task after explicit confirmation. This tool never updates unless confirmed=true.")
    public Object updateTaskNatural(@ToolParam(description = "update_task_natural request") UpdateTaskNaturalToolRequest toolRequest) {
        AgentResolutionResponse<AgentResolvedTask> resolution = resolveTaskForMutation(toolRequest, ProjectPermission.UPDATE_TASK);
        if (!resolution.isResolved()) {
            return resolution;
        }
        AgentResolvedTask target = resolution.getSelected();
        UpdateTaskRequest request = new UpdateTaskRequest();
        request.setTitle(trimToNull(toolRequest.getTitle()));
        request.setDescription(trimToNull(toolRequest.getDescription()));
        request.setPriority(toolRequest.getPriority());
        request.setStatus(toolRequest.getStatus());
        request.setStartDate(toolRequest.getStartDate());
        request.setDueDate(toolRequest.getDueDate());
        request.setPosition(toolRequest.getPosition());
        request.setAssigneeIds(toolRequest.getAssigneeIds());
        request.setParentTaskId(toolRequest.getParentTaskId());
        request.setSprintId(toolRequest.getSprintId());
        request.setRemoveParent(Boolean.TRUE.equals(toolRequest.getRemoveParent()));
        request.setRemoveSprint(Boolean.TRUE.equals(toolRequest.getRemoveSprint()));
        if (!Boolean.TRUE.equals(toolRequest.getConfirmed())) {
            return confirmationRequired("update_task_natural", "Confirm before updating this task", target, request);
        }

        agentConfirmationService.consume(toolRequest.getConfirmationToken(), "update_task_natural", target, request);
        permissionChecker.requireProjectPermission(target.getProjectId(), ProjectPermission.UPDATE_TASK);
        TaskResponse result = taskService.updateTask(target.getProjectId(), target.getTaskId(), request);
        log.info("[mcp-tool] update_task_natural projectId={} taskId={}", target.getProjectId(), target.getTaskId());
        return result;
    }

    @Tool(name = "delete_task_natural", description = "Preview or delete a task after explicit confirmation. This tool never deletes unless confirmed=true.")
    public Object deleteTaskNatural(@ToolParam(description = "delete_task_natural request") DeleteTaskNaturalToolRequest toolRequest) {
        AgentResolutionResponse<AgentResolvedTask> resolution = resolveTaskForMutation(toolRequest, ProjectPermission.DELETE_TASK);
        if (!resolution.isResolved()) {
            return resolution;
        }
        AgentResolvedTask target = resolution.getSelected();
        if (!Boolean.TRUE.equals(toolRequest.getConfirmed())) {
            return confirmationRequired("delete_task_natural", "Confirm before deleting this task", target, null);
        }

        agentConfirmationService.consume(toolRequest.getConfirmationToken(), "delete_task_natural", target, null);
        permissionChecker.requireProjectPermission(target.getProjectId(), ProjectPermission.DELETE_TASK);
        taskService.deleteTask(target.getProjectId(), target.getTaskId());
        log.info("[mcp-tool] delete_task_natural projectId={} taskId={}", target.getProjectId(), target.getTaskId());
        return target;
    }

    @Tool(name = "delete_project_natural", description = "Preview or delete a project after explicit confirmation. This tool never deletes unless confirmed=true.")
    public Object deleteProjectNatural(@ToolParam(description = "delete_project_natural request") DeleteProjectNaturalToolRequest toolRequest) {
        AgentResolutionResponse<AgentResolvedProject> resolution = agentEntityResolverService.resolveProject(
                toolRequest.getProjectId(),
                toolRequest.getProjectName(),
                toolRequest.getWorkspaceId(),
                toolRequest.getWorkspaceName(),
                ProjectPermission.DELETE);
        if (!resolution.isResolved()) {
            return resolution;
        }
        AgentResolvedProject target = resolution.getSelected();
        if (!Boolean.TRUE.equals(toolRequest.getConfirmed())) {
            return confirmationRequired("delete_project_natural", "Confirm before deleting this project", target, null);
        }

        agentConfirmationService.consume(toolRequest.getConfirmationToken(), "delete_project_natural", target, null);
        permissionChecker.requireProjectPermission(target.getProjectId(), ProjectPermission.DELETE);
        projectService.deleteProject(target.getWorkspaceId(), target.getProjectId());
        log.info("[mcp-tool] delete_project_natural workspaceId={} projectId={}", target.getWorkspaceId(), target.getProjectId());
        return target;
    }

    private AgentResolutionResponse<AgentResolvedTask> resolveTaskForMutation(TaskTargetToolRequest toolRequest, ProjectPermission permission) {
        return agentEntityResolverService.resolveTask(
                toolRequest.getTaskId(),
                toolRequest.getTaskTitle(),
                toolRequest.getProjectId(),
                toolRequest.getProjectName(),
                toolRequest.getWorkspaceId(),
                toolRequest.getWorkspaceName(),
                permission);
    }

    private AgentConfirmationRequiredResponse confirmationRequired(String action, String message, Object target, Object changes) {
        AgentConfirmationService.ConfirmationTicket ticket = agentConfirmationService.issue(action, target, changes);
        return AgentConfirmationRequiredResponse.builder()
                .status("CONFIRMATION_REQUIRED")
                .action(action)
                .message(message)
                .confirmationToken(ticket.token())
                .expiresAt(ticket.expiresAt().toString())
                .proposedChangesHash(ticket.proposedChangesHash())
                .target(target)
                .proposedChanges(changes)
                .build();
    }

    private Long resolveWorkspaceForCreateProject(Long workspaceId, String workspaceName) {
        if (workspaceId != null) {
            return workspaceId;
        }
        AgentResolutionResponse<AgentResolvedWorkspace> resolution = agentEntityResolverService.resolveWorkspace(
                null,
                workspaceName,
                WorkspacePermission.CREATE_PROJECT);
        if (resolution.getStatus() == AgentResolutionStatus.RESOLVED && resolution.getSelected() != null) {
            return resolution.getSelected().getWorkspaceId();
        }
        return null;
    }

    private Long requireId(Long value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        return value;
    }

    private String requireNonBlank(String value, String message) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new BadRequestException(message);
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    @Data
    public static class CreateTaskToolRequest {
        private Long projectId;
        private String title;
        private String description;
        private TaskPriority priority;
        private TaskStatus status;
        private OffsetDateTime startDate;
        private OffsetDateTime dueDate;
        private Long parentTaskId;
        private Long sprintId;
        private List<Long> tagIds;
        private List<Long> assigneeIds;
    }

    @Data
    public static class CreateProjectToolRequest {
        private Long workspaceId;
        private String name;
        private String description;
        private ProjectStatus status;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data
    public static class CreateWorkspaceToolRequest {
        private String name;
        private String description;
        private Boolean isPublic;
    }

    @Data
    public static class CreateWorkflowFromProjectToolRequest {
        private Long projectId;
        private Boolean includeSubtasks;
        private Boolean includeCompletedTasks;
        private Boolean useAiRefinement;
    }

    @Data
    public static class UpdateTaskStatusToolRequest {
        private Long projectId;
        private Long taskId;
        private TaskStatus status;
    }

    @Data
    public static class ResolveWorkspaceToolRequest {
        private Long workspaceId;
        private String workspaceName;
        private WorkspacePermission requiredPermission;
    }

    @Data
    public static class ResolveProjectToolRequest {
        private Long projectId;
        private String projectName;
        private Long workspaceId;
        private String workspaceName;
        private ProjectPermission requiredPermission;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class ResolveTaskToolRequest extends TaskTargetToolRequest {
        private ProjectPermission requiredProjectPermission;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class CreateTaskNaturalToolRequest extends CreateTaskToolRequest {
        private String projectName;
        private Long workspaceId;
        private String workspaceName;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class CreateProjectNaturalToolRequest extends CreateProjectToolRequest {
        private String workspaceName;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class CreateProjectWithTasksToolRequest extends CreateProjectNaturalToolRequest {
        private List<CreateTaskNaturalToolRequest> tasks;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class CreateWorkflowFromProjectNaturalToolRequest extends CreateWorkflowFromProjectToolRequest {
        private String projectName;
        private Long workspaceId;
        private String workspaceName;
    }

    @Data
    public static class TaskTargetToolRequest {
        private Long taskId;
        private String taskTitle;
        private Long projectId;
        private String projectName;
        private Long workspaceId;
        private String workspaceName;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class UpdateTaskNaturalToolRequest extends TaskTargetToolRequest {
        private Boolean confirmed;
        private String confirmationToken;
        private String title;
        private String description;
        private TaskPriority priority;
        private TaskStatus status;
        private OffsetDateTime startDate;
        private OffsetDateTime dueDate;
        private Integer position;
        private List<Long> assigneeIds;
        private Long parentTaskId;
        private Long sprintId;
        private Boolean removeParent;
        private Boolean removeSprint;
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class DeleteTaskNaturalToolRequest extends TaskTargetToolRequest {
        private Boolean confirmed;
        private String confirmationToken;
    }

    @Data
    public static class DeleteProjectNaturalToolRequest {
        private Boolean confirmed;
        private String confirmationToken;
        private Long projectId;
        private String projectName;
        private Long workspaceId;
        private String workspaceName;
    }

}
