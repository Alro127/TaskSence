package dev.alro127.tasksense.mcp;

import dev.alro127.tasksense.domain.enums.ProjectStatus;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.CreateWorkflowFromProjectRequest;
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
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
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

    @Tool(name = "create_task", description = "Create a task inside an authorized TaskSense project.")
    public TaskResponse createTask(CreateTaskToolRequest toolRequest) {
        Long projectId = requireId(toolRequest.getProjectId(), "projectId is required for create_task");
        permissionChecker.requireProjectPermission(projectId, ProjectPermission.CREATE_TASK);

        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle(requireNonBlank(toolRequest.getTitle(), "title is required for create_task"));
        request.setDescription(trimToNull(toolRequest.getDescription()));
        request.setPriority(toolRequest.getPriority());
        request.setStatus(toolRequest.getStatus());
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
    public ProjectResponse createProject(CreateProjectToolRequest toolRequest) {
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
    public WorkspaceResponse createWorkspace(CreateWorkspaceToolRequest toolRequest) {
        CreateWorkspaceRequest request = new CreateWorkspaceRequest();
        request.setName(requireNonBlank(toolRequest.getName(), "name is required for create_workspace"));
        request.setDescription(trimToNull(toolRequest.getDescription()));
        request.setIsPublic(toolRequest.getIsPublic());

        WorkspaceResponse result = workspaceService.createWorkspace(request);
        log.info("[mcp-tool] create_workspace workspaceId={}", result.getId());
        return result;
    }

    @Tool(name = "create_workflow_from_project", description = "Create a workflow draft from an existing authorized TaskSense project using the current stable workflow logic.")
    public WorkflowDraftResponse createWorkflowFromProject(CreateWorkflowFromProjectToolRequest toolRequest) {
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

}
