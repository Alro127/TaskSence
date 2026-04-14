package dev.alro127.tasksense.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.domain.enums.ProjectStatus;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.dto.request.McpExecuteRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskStatusRequest;
import dev.alro127.tasksense.dto.response.McpExecuteResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.security.permission.PermissionChecker;
import dev.alro127.tasksense.security.permission.ProjectPermission;
import dev.alro127.tasksense.security.permission.WorkspacePermission;
import dev.alro127.tasksense.service.McpService;
import dev.alro127.tasksense.service.ProjectService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.TaskService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class McpServiceImpl implements McpService {

    private static final String ACTION_CREATE_TASK = "create_task";
    private static final String ACTION_CREATE_PROJECT = "create_project";
    private static final String ACTION_UPDATE_TASK_STATUS = "update_task_status";
    private static final String ACTION_CREATE_PROJECT_FROM_WORKFLOW = "create_project_from_workflow";

    private final ObjectMapper objectMapper;
    private final SecurityService securityService;
    private final PermissionChecker permissionChecker;
    private final TaskService taskService;
    private final ProjectService projectService;

    @Override
    public McpExecuteResponse execute(McpExecuteRequest request) {
        validateActor(request.getActorUserId());

        String action = normalizeAction(request.getAction());
        Map<String, Object> arguments = request.getArguments();

        log.info("[mcp-service] execute action={} actorUserId={}", action, request.getActorUserId());

        return switch (action) {
            case ACTION_CREATE_TASK -> executeCreateTask(arguments);
            case ACTION_CREATE_PROJECT -> executeCreateProject(arguments);
            case ACTION_UPDATE_TASK_STATUS -> executeUpdateTaskStatus(arguments);
            case ACTION_CREATE_PROJECT_FROM_WORKFLOW -> McpExecuteResponse.builder()
                    .action(action)
                    .executed(false)
                    .message("Action scaffolded but not implemented yet on Spring side")
                    .result(null)
                    .build();
            default -> throw new BadRequestException("Unsupported MCP action: " + action);
        };
    }

    private McpExecuteResponse executeCreateTask(Map<String, Object> arguments) {
        CreateTaskArgs args = objectMapper.convertValue(arguments, CreateTaskArgs.class);
        if (args.getProjectId() == null) {
            throw new BadRequestException("projectId is required for create_task");
        }

        permissionChecker.requireProjectPermission(args.getProjectId(), ProjectPermission.CREATE_TASK);

        CreateTaskRequest request = new CreateTaskRequest();
        request.setTitle(requireNonBlank(args.getTitle(), "title is required for create_task"));
        request.setDescription(args.getDescription());
        request.setPriority(parseTaskPriority(args.getPriority()));
        request.setStatus(parseTaskStatus(args.getStatus()));
        request.setStartDate(args.getStartDate());
        request.setDueDate(args.getDueDate());
        request.setParentTaskId(args.getParentTaskId());
        request.setSprintId(args.getSprintId());
        request.setTagIds(args.getTagIds());
        request.setAssigneeIds(args.getAssigneeIds());

        Object result = taskService.createTask(args.getProjectId(), request);
        return McpExecuteResponse.builder()
                .action(ACTION_CREATE_TASK)
                .executed(true)
                .message("Task created successfully")
                .result(result)
                .build();
    }

    private McpExecuteResponse executeCreateProject(Map<String, Object> arguments) {
        CreateProjectArgs args = objectMapper.convertValue(arguments, CreateProjectArgs.class);
        if (args.getWorkspaceId() == null) {
            throw new BadRequestException("workspaceId is required for create_project");
        }

        if (!permissionChecker.workspace(args.getWorkspaceId(), WorkspacePermission.CREATE_PROJECT.name())) {
            throw new UnauthorizedException("You do not have CREATE_PROJECT permission on this workspace");
        }

        CreateProjectRequest request = new CreateProjectRequest();
        request.setName(requireNonBlank(args.getName(), "name is required for create_project"));
        request.setDescription(args.getDescription());
        request.setStatus(parseProjectStatus(args.getStatus()));
        request.setStartDate(args.getStartDate());
        request.setEndDate(args.getEndDate());

        Object result = projectService.createProject(args.getWorkspaceId(), request);
        return McpExecuteResponse.builder()
                .action(ACTION_CREATE_PROJECT)
                .executed(true)
                .message("Project created successfully")
                .result(result)
                .build();
    }

    private McpExecuteResponse executeUpdateTaskStatus(Map<String, Object> arguments) {
        UpdateTaskStatusArgs args = objectMapper.convertValue(arguments, UpdateTaskStatusArgs.class);
        if (args.getProjectId() == null) {
            throw new BadRequestException("projectId is required for update_task_status");
        }
        if (args.getTaskId() == null) {
            throw new BadRequestException("taskId is required for update_task_status");
        }

        permissionChecker.requireProjectPermission(args.getProjectId(), ProjectPermission.UPDATE_TASK_STATUS);

        UpdateTaskStatusRequest request = new UpdateTaskStatusRequest();
        request.setStatus(requireTaskStatus(args.getStatus()));

        Object result = taskService.updateTaskStatus(args.getProjectId(), args.getTaskId(), request);
        return McpExecuteResponse.builder()
                .action(ACTION_UPDATE_TASK_STATUS)
                .executed(true)
                .message("Task status updated successfully")
                .result(result)
                .build();
    }

    private void validateActor(Long actorUserId) {
        Long currentUserId = securityService.getCurrentUserId();
        if (!currentUserId.equals(actorUserId)) {
            throw new UnauthorizedException("actorUserId does not match authenticated user");
        }
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            throw new BadRequestException("action is required");
        }
        return action.trim().toLowerCase(Locale.ROOT);
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private TaskPriority parseTaskPriority(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return TaskPriority.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid task priority: " + value);
        }
    }

    private TaskStatus parseTaskStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return TaskStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid task status: " + value);
        }
    }

    private TaskStatus requireTaskStatus(String value) {
        TaskStatus status = parseTaskStatus(value);
        if (status == null) {
            throw new BadRequestException("status is required for update_task_status");
        }
        return status;
    }

    private ProjectStatus parseProjectStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ProjectStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid project status: " + value);
        }
    }

    @Data
    private static class CreateTaskArgs {
        private Long projectId;
        private String title;
        private String description;
        private String priority;
        private String status;
        private OffsetDateTime startDate;
        private OffsetDateTime dueDate;
        private Long parentTaskId;
        private Long sprintId;
        private List<Long> tagIds;
        private List<Long> assigneeIds;
    }

    @Data
    private static class CreateProjectArgs {
        private Long workspaceId;
        private String name;
        private String description;
        private String status;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data
    private static class UpdateTaskStatusArgs {
        private Long projectId;
        private Long taskId;
        private String status;
    }
}
