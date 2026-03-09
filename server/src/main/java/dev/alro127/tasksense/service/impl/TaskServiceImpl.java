package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.dto.request.TaskSearchRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskStatusRequest;
import dev.alro127.tasksense.dto.response.TaskResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SecurityService securityService;

    // ===== Helpers =====

    private ProjectEntity getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private void requireProjectMember(Long projectId, Long userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("You are not a member of this project");
        }
    }

    private boolean isManager(Long projectId, Long userId) {
        return projectMemberRepository.existsByProjectIdAndUserIdAndRole(projectId, userId, ProjectMemberRole.MANAGER);
    }

    /**
     * VIEWER cannot create, update, or delete tasks.
     */
    private void requireNotViewer(Long projectId, Long userId) {
        if (!isManager(projectId, userId) &&
                !projectMemberRepository.existsByProjectIdAndUserIdAndRole(projectId, userId, ProjectMemberRole.MEMBER)) {
            throw new UnauthorizedException("Viewers are not allowed to perform this action");
        }
    }

    /**
     * MANAGER: can modify any task.
     * MEMBER: can only modify tasks they created.
     */
    private void requireTaskEditPermission(Long projectId, Long userId, TaskEntity task) {
        if (isManager(projectId, userId)) return;
        if (!task.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to modify this task");
        }
    }

    /**
     * MANAGER: can update status of any task.
     * MEMBER: can update status of tasks they created or are assigned to.
     */
    private void requireTaskStatusPermission(Long projectId, Long userId, TaskEntity task) {
        if (isManager(projectId, userId)) return;
        boolean isCreator = task.getCreatedBy().getId().equals(userId);
        boolean isAssignee = task.getAssignees().stream().anyMatch(u -> u.getId().equals(userId));
        if (!isCreator && !isAssignee) {
            throw new UnauthorizedException("You do not have permission to update status of this task");
        }
    }

    // TODO: implement require Workspace member

    private TaskEntity getTaskOrThrow(Long projectId, Long taskId) {
        return taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private static final int MAX_TASK_DEPTH = 5;

    private void validateNoCircularParent(Long taskId, Long parentTaskId) {
        Long current = parentTaskId;
        int depth = 0;
        while (current != null && depth < MAX_TASK_DEPTH) {
            if (current.equals(taskId)) {
                throw new BadRequestException("Circular parent-child relationship detected");
            }
            current = taskRepository.findById(current)
                    .map(t -> t.getParentTask() != null ? t.getParentTask().getId() : null)
                    .orElse(null);
            depth++;
        }
        if (depth >= MAX_TASK_DEPTH) {
            throw new BadRequestException("Task nesting exceeds maximum depth of " + MAX_TASK_DEPTH);
        }
    }

    private Set<UserEntity> resolveAssignees(List<Long> assigneeIds, Long projectId) {
        if (assigneeIds == null || assigneeIds.isEmpty())
            return new HashSet<>();

        Set<UserEntity> assignees = new HashSet<>();
        for (Long assigneeId : assigneeIds) {
            UserEntity assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + assigneeId));
            if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)) {
                throw new UnauthorizedException("User " + assigneeId + " is not a member of this project");
            }
            assignees.add(assignee);
        }
        return assignees;
    }

    // ===== CRUD =====

    @Override
    @Transactional
    public TaskResponse createTask(Long projectId, CreateTaskRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());
        requireNotViewer(projectId, currentUser.getId());

        ProjectEntity project = getProjectOrThrow(projectId);

        TaskEntity.TaskEntityBuilder builder = TaskEntity.builder()
                .project(project)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .priority(request.getPriority())
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .createdBy(currentUser)
                .assignees(resolveAssignees(request.getAssigneeIds(), projectId));

        if (request.getParentTaskId() != null) {
            TaskEntity parent = getTaskOrThrow(projectId, request.getParentTaskId());
            builder.parentTask(parent);
        }

        TaskEntity saved = taskRepository.save(builder.build());
        return TaskResponse.mapToResponse(saved);
    }

    @Override
    public TaskResponse getTaskById(Long projectId, Long taskId) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());

        TaskEntity task = getTaskOrThrow(projectId, taskId);
        return TaskResponse.mapToResponse(task);
    }

    @Override
    public List<TaskResponse> getTasksByProject(Long projectId) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());

        return taskRepository.findByProjectId(projectId).stream()
                .map(TaskResponse::mapToResponse)
                .toList();
    }

    @Override
    public List<TaskResponse> searchTasks(Long projectId, TaskSearchRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());

        return taskRepository.searchTasks(
                projectId,
                request.getStatus(),
                request.getKeyword(),
                request.getCursor(),
                PageRequest.of(0, request.getSize())).stream().map(TaskResponse::mapToResponse).toList();
    }

    @Override
    public List<TaskResponse> getSubTasks(Long projectId, Long parentTaskId) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());

        getTaskOrThrow(projectId, parentTaskId);

        return taskRepository.findByParentTaskId(parentTaskId).stream()
                .map(TaskResponse::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long projectId, Long taskId, UpdateTaskRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());
        requireNotViewer(projectId, currentUser.getId());

        TaskEntity task = getTaskOrThrow(projectId, taskId);
        requireTaskEditPermission(projectId, currentUser.getId(), task);

        if (request.getTitle() != null)
            task.setTitle(request.getTitle().trim());
        if (request.getDescription() != null)
            task.setDescription(request.getDescription());
        if (request.getPriority() != null)
            task.setPriority(request.getPriority());
        if (request.getStartDate() != null)
            task.setStartDate(request.getStartDate());
        if (request.getDueDate() != null)
            task.setDueDate(request.getDueDate());
        if (request.getPosition() != null)
            task.setPosition(request.getPosition());
        if (request.getAssigneeIds() != null)
            task.setAssignees(resolveAssignees(request.getAssigneeIds(), projectId));

        if (request.isRemoveParent()) {
            task.setParentTask(null);
        } else if (request.getParentTaskId() != null) {
            validateNoCircularParent(taskId, request.getParentTaskId());
            TaskEntity parent = getTaskOrThrow(projectId, request.getParentTaskId());
            task.setParentTask(parent);
        }

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            if (request.getStatus() == TaskStatus.DONE) {
                task.setCompletedAt(OffsetDateTime.now());
            } else {
                task.setCompletedAt(null);
            }
        }

        taskRepository.save(task);
        return TaskResponse.mapToResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(Long projectId, Long taskId, UpdateTaskStatusRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());
        requireNotViewer(projectId, currentUser.getId());

        TaskEntity task = getTaskOrThrow(projectId, taskId);
        requireTaskStatusPermission(projectId, currentUser.getId(), task);

        task.setStatus(request.getStatus());
        if (request.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(OffsetDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        taskRepository.save(task);
        return TaskResponse.mapToResponse(task);
    }

    @Override
    @Transactional
    public void deleteTask(Long projectId, Long taskId) {
        UserEntity currentUser = securityService.getCurrentUser();
        requireProjectMember(projectId, currentUser.getId());
        requireNotViewer(projectId, currentUser.getId());

        TaskEntity task = getTaskOrThrow(projectId, taskId);
        requireTaskEditPermission(projectId, currentUser.getId(), task);

        task.setDeletedAt(OffsetDateTime.now());
        taskRepository.save(task);
    }
}
