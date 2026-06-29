package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.GuidanceConditionType;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskStatusRequest;
import dev.alro127.tasksense.dto.response.TaskResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.*;
import dev.alro127.tasksense.security.permission.EffectivePermissionResolver;
import dev.alro127.tasksense.security.permission.PermissionChecker;
import dev.alro127.tasksense.security.permission.TaskPermission;
import dev.alro127.tasksense.event.EntityChangedEvent;
import dev.alro127.tasksense.event.EntityChangedEvent.Operation;
import dev.alro127.tasksense.service.*;
import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SecurityService securityService;
    private final PermissionChecker permissionChecker;
    private final EffectivePermissionResolver permissionResolver;
    private final ReminderService reminderService;
    private final NotificationService notificationService;
    private final TagRepository tagRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ProjectGuidanceService projectGuidanceService;

    // ===== Helpers =====

    private ProjectEntity getProjectOrThrow(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

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

    private Set<TagEntity> resolveTags(List<Long> tagIds, Long projectId) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new HashSet<>();
        }

        List<TagEntity> tags = tagRepository.findAllByIdInAndProjectId(tagIds, projectId);
        if (tags.size() != tagIds.size()) {
            throw new ResourceNotFoundException("Some tags not found in project");
        }

        return new HashSet<>(tags);
    }

    private TaskResponse toResponseWithPermissions(TaskEntity task, Long projectId) {
        Long userId = securityService.getCurrentUserId();
        TaskResponse response = TaskResponse.mapToResponse(task);
        response.setPermissions(permissionResolver.resolveTaskPermissions(userId, projectId, task));
        return response;
    }

    private SprintEntity resolveSprint(Long projectId, Long sprintId) {
        if (sprintId == null) {
            return null;
        }

        SprintEntity sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

        if (!sprint.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Sprint does not belong to this project");
        }

        return sprint;
    }

    private void validateTaskDatesWithSprint(OffsetDateTime taskStartDate, OffsetDateTime taskDueDate, SprintEntity sprint) {
        if (sprint == null) return;
        
        LocalDate sprintStart = sprint.getStartDate();
        LocalDate sprintEnd = sprint.getEndDate();

        LocalDate taskStart = taskStartDate != null ? taskStartDate.toLocalDate() : null;
        LocalDate taskDue = taskDueDate != null ? taskDueDate.toLocalDate() : null;

        if (taskStart != null && (taskStart.isBefore(sprintStart) || taskStart.isAfter(sprintEnd))) {
            throw new BadRequestException("Task start date must be within sprint dates");
        }
        
        if (taskDue != null && (taskDue.isBefore(sprintStart) || taskDue.isAfter(sprintEnd))) {
            throw new BadRequestException("Task due date must be within sprint dates");
        }
    }

    // ===== CRUD =====

    @Override
    @Transactional
    public TaskResponse createTask(Long projectId, CreateTaskRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();
        // @PreAuthorize đã kiểm tra role-based permission (CREATE_TASK)

        ProjectEntity project = getProjectOrThrow(projectId);

        TaskEntity task = TaskEntity.builder()
                .project(project)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .sprint(resolveSprint(projectId, request.getSprintId()))
                .tags(resolveTags(request.getTagIds(), projectId))
                .createdBy(currentUser)
                .assignees(resolveAssignees(request.getAssigneeIds(), projectId))
                .build();

        if (request.getParentTaskId() != null) {
            TaskEntity parent = getTaskOrThrow(projectId, request.getParentTaskId());
            task.setParentTask(parent);
        }

        validateTaskDatesWithSprint(task.getStartDate(), task.getDueDate(), task.getSprint());

        TaskEntity saved = taskRepository.save(task);
        WorkspaceEntity workspace = project.getWorkspace();

        for (UserEntity u : task.getAssignees()) {
            notificationService.saveAndPublish(NotificationMessage.builder()
                    .receiverId(u.getId())
                    .actorId(securityService.getCurrentUserId())
                    .type(NotificationType.TASK_ASSIGNED)
                    .referenceType(EntityType.TASK)
                    .referenceId(projectId)
                    .payload(Map.of(
                            "sender", securityService.getCurrentUser().getFullName(),
                            "referenceName", task.getTitle(),
                            "projectId", project.getId(),
                            "workspaceId", workspace.getId()))
                    .build());
        }

        if (saved.getDueDate() != null) {
            OffsetDateTime reminderTime = saved.getDueDate().minusMinutes(15);

            reminderService.scheduleReminder(saved.getId(), reminderTime);
        }

        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.TASK, saved.getId(), Operation.UPSERT));
        projectGuidanceService.reportAction(projectId, GuidanceConditionType.TASK_CREATED,
                Map.of("taskId", saved.getId()));
        return toResponseWithPermissions(saved, projectId);
    }

    @Override
    public TaskResponse getTaskById(Long projectId, Long taskId) {
        // @PreAuthorize đã kiểm tra VIEW_TASKS permission
        TaskEntity task = getTaskOrThrow(projectId, taskId);
        return toResponseWithPermissions(task, projectId);
    }

    @Override
    public PageResponse<TaskResponse> getTasksByProject(Long projectId, Pageable pageable) {
        // @PreAuthorize đã kiểm tra VIEW_TASKS permission

        Long userId = securityService.getCurrentUserId();
        Page<TaskResponse> responsePage = taskRepository
                .findByProjectId(projectId, pageable)
                .map(task -> {
                    TaskResponse response = TaskResponse.mapToResponse(task);
                    response.setPermissions(permissionResolver.resolveTaskPermissions(userId, projectId, task));
                    return response;
                });

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    public PageResponse<TaskResponse> searchTasks(Long projectId, TaskStatus status, TaskPriority priority,
            Long assigneeId, Long sprintId, List<Long> tagIds,
            String keyword, OffsetDateTime dueDateFrom, OffsetDateTime dueDateTo, Pageable pageable) {
        // @PreAuthorize đã kiểm tra VIEW_TASKS permission

        boolean filterByTags = tagIds != null && !tagIds.isEmpty();
        List<Long> normalizedTagIds = filterByTags ? tagIds : List.of(-1L);

        Page<TaskResponse> responsePage = taskRepository
                .searchTasks(projectId,
                        status != null ? status.name() : null,
                        priority != null ? priority.name() : null,
                        assigneeId, sprintId, filterByTags, normalizedTagIds,
                        keyword, dueDateFrom, dueDateTo,
                        pageable)
                .map(task -> toResponseWithPermissions(task, projectId));

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    public PageResponse<TaskResponse> getSubTasks(Long projectId, Long parentTaskId, Pageable pageable) {
        // @PreAuthorize đã kiểm tra VIEW_TASKS permission
        getTaskOrThrow(projectId, parentTaskId);

        Long userId = securityService.getCurrentUserId();
        Page<TaskResponse> responsePage = taskRepository
                .findByParentTaskId(parentTaskId, pageable)
                .map(task -> {
                    TaskResponse response = TaskResponse.mapToResponse(task);
                    response.setPermissions(permissionResolver.resolveTaskPermissions(userId, projectId, task));
                    return response;
                });

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long projectId, Long taskId, UpdateTaskRequest request) {
        // @PreAuthorize đã kiểm tra UPDATE_TASK permission (role-based)

        TaskEntity task = getTaskOrThrow(projectId, taskId);
        // Resource-level: MANAGER edit bất kỳ, MEMBER chỉ edit task mình tạo
        permissionChecker.requireTaskPermission(projectId, task, TaskPermission.EDIT);

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
        if (request.getAssigneeIds() != null) {

            Set<UserEntity> oldAssignees = new HashSet<>(task.getAssignees());
            Set<UserEntity> newAssignees = resolveAssignees(request.getAssigneeIds(), projectId);

            Set<UserEntity> addedAssignees = new HashSet<>(newAssignees);
            addedAssignees.removeAll(oldAssignees);

            Set<UserEntity> removedAssignees = new HashSet<>(oldAssignees);
            removedAssignees.removeAll(newAssignees);

            task.setAssignees(newAssignees);

            WorkspaceEntity workspace = task.getProject().getWorkspace();

            // notify new assignees
            for (UserEntity u : addedAssignees) {
                notificationService.saveAndPublish(NotificationMessage.builder()
                        .receiverId(u.getId())
                        .actorId(securityService.getCurrentUserId())
                        .type(NotificationType.TASK_ASSIGNED)
                        .referenceType(EntityType.TASK)
                        .referenceId(task.getId())
                        .payload(Map.of(
                                "sender", securityService.getCurrentUser().getFullName(),
                                "referenceName", task.getTitle(),
                                "projectId", projectId,
                                "workspaceId", workspace.getId()))
                        .build());
            }

            for (UserEntity u : removedAssignees) {
                notificationService.saveAndPublish(NotificationMessage.builder()
                        .receiverId(u.getId())
                        .actorId(securityService.getCurrentUserId())
                        .type(NotificationType.TASK_UNASSIGNED)
                        .referenceType(EntityType.TASK)
                        .referenceId(task.getId())
                        .payload(Map.of(
                                "sender", securityService.getCurrentUser().getFullName(),
                                "referenceName", task.getTitle(),
                                "projectId", projectId,
                                "workspaceId", workspace.getId()))
                        .build());
            }

        }

        if (request.isRemoveSprint()) {
            task.setSprint(null);
        } else if (request.getSprintId() != null) {
            task.setSprint(resolveSprint(projectId, request.getSprintId()));
        }

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

        validateTaskDatesWithSprint(task.getStartDate(), task.getDueDate(), task.getSprint());

        TaskEntity saved = taskRepository.save(task);

        reminderService.removeReminder(taskId);

        if (request.getDueDate() != null && !saved.getStatus().equals(TaskStatus.DONE)
                && !saved.getStatus().equals(TaskStatus.REVIEW)) {

            OffsetDateTime reminderTime = saved.getDueDate().minusMinutes(15);
            reminderService.scheduleReminder(saved.getId(), reminderTime);
        }
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.TASK, saved.getId(), Operation.UPSERT));
        return toResponseWithPermissions(task, projectId);
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(Long projectId, Long taskId, UpdateTaskStatusRequest request) {
        // @PreAuthorize đã kiểm tra UPDATE_TASK_STATUS permission (role-based)

        TaskEntity task = getTaskOrThrow(projectId, taskId);
        // Resource-level: MANAGER update bất kỳ, MEMBER chỉ update task mình tạo/được
        // assign
        permissionChecker.requireTaskPermission(projectId, task, TaskPermission.UPDATE_STATUS);

        task.setStatus(request.getStatus());
        if (request.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(OffsetDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        taskRepository.save(task);
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.TASK, taskId, Operation.UPSERT));
        projectGuidanceService.reportAction(projectId, GuidanceConditionType.TASK_STATUS_UPDATED,
                Map.of("taskId", taskId, "status", request.getStatus()));
        return toResponseWithPermissions(task, projectId);
    }

    @Override
    @Transactional
    public void deleteTask(Long projectId, Long taskId) {
        // @PreAuthorize đã kiểm tra DELETE_TASK permission (role-based)

        TaskEntity task = getTaskOrThrow(projectId, taskId);
        // Resource-level: MANAGER delete bất kỳ, MEMBER chỉ delete task mình tạo
        permissionChecker.requireTaskPermission(projectId, task, TaskPermission.DELETE);

        OffsetDateTime now = OffsetDateTime.now();

        // Cascade soft delete subtasks
        taskRepository.softDeleteByParentTaskId(taskId, now);

        task.setDeletedAt(now);
        taskRepository.save(task);
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.TASK, taskId, Operation.DELETE));
    }

    @Override
    @Transactional
    public void addTagsToTask(Long projectId, Long taskId, List<Long> tagIds) {

        TaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ConflictException("Task does not belong to project");
        }

        List<TagEntity> tags = tagRepository.findAllByIdInAndProjectId(tagIds, projectId);

        if (tags.size() != tagIds.size()) {
            throw new ResourceNotFoundException("Some tags not found in project");
        }

        task.getTags().addAll(tags);

        taskRepository.save(task);
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.TASK, taskId, Operation.UPSERT));
    }

    @Override
    @Transactional
    public void removeTagsFromTask(Long projectId, Long taskId, List<Long> tagIds) {

        TaskEntity task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ConflictException("Task does not belong to project");
        }

        task.getTags().removeIf(tag -> tagIds.contains(tag.getId()));

        taskRepository.save(task);
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.TASK, taskId, Operation.UPSERT));
    }
}
