package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.SprintEntity;
import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkflowEntity;
import dev.alro127.tasksense.domain.entity.WorkflowFavoriteEntity;
import dev.alro127.tasksense.domain.entity.WorkflowRatingEntity;
import dev.alro127.tasksense.domain.entity.WorkflowStepEntity;
import dev.alro127.tasksense.domain.entity.WorkflowStepTaskEntity;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.domain.enums.WorkflowGenerationSource;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateWorkflowFromProjectRequest;
import dev.alro127.tasksense.dto.request.UpsertWorkflowRatingRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowDraftRequest;
import dev.alro127.tasksense.dto.response.WorkflowDraftResponse;
import dev.alro127.tasksense.dto.response.WorkflowFavoriteToggleResponse;
import dev.alro127.tasksense.dto.response.WorkflowRatingResponse;
import dev.alro127.tasksense.dto.response.WorkflowRatingSummaryResponse;
import dev.alro127.tasksense.dto.response.WorkflowStepResponse;
import dev.alro127.tasksense.dto.response.WorkflowStepTaskSummaryResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.WorkflowFavoriteRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowRatingRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.SprintRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowStepRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowStepTaskRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowServiceImpl implements WorkflowService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final WorkflowRepository workflowRepository;
    private final WorkflowStepRepository workflowStepRepository;
    private final WorkflowStepTaskRepository workflowStepTaskRepository;
    private final WorkflowRatingRepository workflowRatingRepository;
    private final WorkflowFavoriteRepository workflowFavoriteRepository;
    private final SecurityService securityService;

    @Override
    @Transactional
    public WorkflowDraftResponse createWorkflowFromProject(Long projectId, CreateWorkflowFromProjectRequest request) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        boolean includeSubtasks = request == null || request.getIncludeSubtasks() == null
                || request.getIncludeSubtasks();
        boolean includeCompletedTasks = request != null
                && request.getIncludeCompletedTasks() != null
                && request.getIncludeCompletedTasks();
        boolean useAiRefinement = request != null
                && request.getUseAiRefinement() != null
                && request.getUseAiRefinement();

        List<TaskEntity> tasks = new ArrayList<>(taskRepository.findAllByProjectIdOrderByPositionAscIdAsc(projectId));

        if (!includeSubtasks) {
            tasks = tasks.stream()
                    .filter(task -> task.getParentTask() == null)
                    .toList();
        }

        if (!includeCompletedTasks) {
            tasks = tasks.stream()
                    .filter(task -> task.getStatus() != TaskStatus.DONE)
                    .toList();
        }

        if (tasks.isEmpty()) {
            throw new BadRequestException("Project has no tasks to generate workflow");
        }

        List<SprintEntity> sprints = sprintRepository.findAllByProjectIdOrderByStartDateAscIdAsc(projectId);
        long sprintTaskCount = tasks.stream().filter(task -> task.getSprint() != null).count();
        double sprintRatio = (double) sprintTaskCount / tasks.size();

        List<StepDraft> draftSteps;
        if (!sprints.isEmpty() && sprintRatio >= 0.6d) { // rule-based
            draftSteps = buildSprintBasedSteps(tasks, sprints);
        } else {
            draftSteps = buildStatusBasedSteps(tasks);
        }

        UserEntity currentUser = securityService.getCurrentUser();
        WorkflowEntity workflow = workflowRepository.save(WorkflowEntity.builder()
                .project(project)
                .createdBy(currentUser)
                .name(project.getName() + " Workflow Draft")
                .description("Generated from project " + project.getName())
                .status(WorkflowStatus.DRAFT)
                .generationSource(WorkflowGenerationSource.RULE_BASED)
                .aiRefinementRequested(useAiRefinement)
                .build());

        List<WorkflowStepResponse> stepResponses = new ArrayList<>();
        int position = 1;
        for (StepDraft draft : draftSteps) {
            WorkflowStepEntity step = workflowStepRepository.save(WorkflowStepEntity.builder()
                    .workflow(workflow)
                    .title(draft.title)
                    .description(draft.description)
                    .position(position)
                    .sourceType(draft.sourceType)
                    .sourceSprint(draft.sourceSprint)
                    .build());

            List<WorkflowStepTaskEntity> stepTasks = draft.tasks.stream()
                    .map(task -> WorkflowStepTaskEntity.builder()
                            .workflowStep(step)
                            .task(task)
                            .build())
                    .toList();
            workflowStepTaskRepository.saveAll(stepTasks);

            List<WorkflowStepTaskSummaryResponse> taskResponses = draft.tasks.stream()
                    .map(this::toTaskSummary)
                    .toList();

            stepResponses.add(WorkflowStepResponse.builder()
                    .id(step.getId())
                    .title(step.getTitle())
                    .description(step.getDescription())
                    .position(step.getPosition())
                    .sourceType(step.getSourceType())
                    .sourceSprintId(step.getSourceSprint() != null ? step.getSourceSprint().getId() : null)
                    .tasks(taskResponses)
                    .build());
            position++;
        }

        return toWorkflowDraftResponse(workflow, stepResponses);
    }

    @Override
    @Transactional
    public WorkflowDraftResponse updateWorkflowDraft(Long workflowId, UpdateWorkflowDraftRequest request) {
        WorkflowEntity workflow = getOwnedWorkflowOrThrow(workflowId);

        if (workflow.getStatus() != WorkflowStatus.DRAFT) {
            throw new BadRequestException("Only draft workflow can be updated");
        }

        if (request.getSteps() == null || request.getSteps().isEmpty()) {
            throw new BadRequestException("Workflow steps are required");
        }

        workflow.setName(request.getName().trim());
        workflow.setDescription(request.getDescription());

        Set<Long> allTaskIds = request.getSteps().stream()
                .flatMap(step -> step.getTaskIds().stream())
                .collect(Collectors.toSet());

        List<TaskEntity> tasks = taskRepository.findAllByIdInAndProjectId(new ArrayList<>(allTaskIds),
                workflow.getProject().getId());
        if (tasks.size() != allTaskIds.size()) {
            throw new BadRequestException("Some tasks do not belong to workflow project");
        }

        Map<Long, TaskEntity> taskById = tasks.stream().collect(Collectors.toMap(TaskEntity::getId, task -> task));

        Set<Long> sprintIds = request.getSteps().stream()
                .map(UpdateWorkflowDraftRequest.UpdateWorkflowStepRequest::getSourceSprintId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Map<Long, SprintEntity> sprintById = new HashMap<>();
        if (!sprintIds.isEmpty()) {
            List<SprintEntity> sprints = sprintRepository.findAllById(new ArrayList<>(sprintIds));
            if (sprints.size() != sprintIds.size()) {
                throw new BadRequestException("Some source sprints are invalid");
            }
            for (SprintEntity sprint : sprints) {
                if (!sprint.getProject().getId().equals(workflow.getProject().getId())) {
                    throw new BadRequestException("Some source sprints do not belong to workflow project");
                }
                sprintById.put(sprint.getId(), sprint);
            }
        }

        List<WorkflowStepEntity> existingSteps = workflowStepRepository
                .findAllByWorkflowIdOrderByPositionAscIdAsc(workflowId);
        if (!existingSteps.isEmpty()) {
            List<Long> existingStepIds = existingSteps.stream().map(WorkflowStepEntity::getId).toList();
            workflowStepTaskRepository.deleteByWorkflowStepIdIn(existingStepIds);
            workflowStepRepository.deleteByWorkflowId(workflowId);
        }

        List<WorkflowStepResponse> stepResponses = new ArrayList<>();
        for (UpdateWorkflowDraftRequest.UpdateWorkflowStepRequest stepRequest : request.getSteps()) {
            WorkflowStepEntity step = workflowStepRepository.save(WorkflowStepEntity.builder()
                    .workflow(workflow)
                    .title(stepRequest.getTitle().trim())
                    .description(stepRequest.getDescription())
                    .position(stepRequest.getPosition())
                    .sourceType(stepRequest.getSourceType() != null && !stepRequest.getSourceType().isBlank()
                            ? stepRequest.getSourceType().trim()
                            : "RULE")
                    .sourceSprint(
                            stepRequest.getSourceSprintId() != null ? sprintById.get(stepRequest.getSourceSprintId())
                                    : null)
                    .build());

            List<TaskEntity> stepTasks = stepRequest.getTaskIds().stream()
                    .map(taskById::get)
                    .toList();

            List<WorkflowStepTaskEntity> stepTaskEntities = stepTasks.stream()
                    .map(task -> WorkflowStepTaskEntity.builder()
                            .workflowStep(step)
                            .task(task)
                            .build())
                    .toList();
            workflowStepTaskRepository.saveAll(stepTaskEntities);

            List<WorkflowStepTaskSummaryResponse> taskResponses = stepTasks.stream()
                    .map(this::toTaskSummary)
                    .toList();

            stepResponses.add(WorkflowStepResponse.builder()
                    .id(step.getId())
                    .title(step.getTitle())
                    .description(step.getDescription())
                    .position(step.getPosition())
                    .sourceType(step.getSourceType())
                    .sourceSprintId(step.getSourceSprint() != null ? step.getSourceSprint().getId() : null)
                    .tasks(taskResponses)
                    .build());
        }

        WorkflowEntity saved = workflowRepository.save(workflow);
        return toWorkflowDraftResponse(saved, stepResponses);
    }

    @Override
    @Transactional
    public WorkflowDraftResponse publishWorkflow(Long workflowId) {
        WorkflowEntity workflow = getOwnedWorkflowOrThrow(workflowId);

        if (workflow.getStatus() != WorkflowStatus.DRAFT) {
            throw new BadRequestException("Workflow is not in draft status and cannot be published");
        }

        String name = workflow.getName() != null ? workflow.getName().trim() : "";
        if (name.isBlank()) {
            throw new BadRequestException("Workflow name is required before publishing");
        }

        String description = workflow.getDescription() != null ? workflow.getDescription().trim() : "";
        if (description.isBlank() || description.length() < 20) {
            throw new BadRequestException("Workflow description must be at least 20 characters before publishing");
        }

        List<WorkflowStepEntity> steps = workflowStepRepository.findAllByWorkflowIdOrderByPositionAscIdAsc(workflowId);
        if (steps.isEmpty()) {
            throw new BadRequestException("Workflow must have at least one step before publishing");
        }

        List<Long> stepIds = steps.stream()
                .map(WorkflowStepEntity::getId)
                .toList();
        List<WorkflowStepTaskEntity> stepTasks = workflowStepTaskRepository.findAllByWorkflowStepIdIn(stepIds);
        Map<Long, Long> taskCountByStepId = stepTasks.stream()
                .collect(Collectors.groupingBy(stepTask -> stepTask.getWorkflowStep().getId(), Collectors.counting()));

        boolean hasStepWithoutTasks = steps.stream()
                .anyMatch(step -> taskCountByStepId.getOrDefault(step.getId(), 0L) == 0L);
        if (hasStepWithoutTasks) {
            throw new BadRequestException("Each workflow step must have at least one mapped task before publishing");
        }

        workflow.setStatus(WorkflowStatus.PUBLIC);
        if (workflow.getPublishedAt() == null) {
            workflow.setPublishedAt(OffsetDateTime.now());
        }
        WorkflowEntity saved = workflowRepository.save(workflow);
        return toWorkflowDraftResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WorkflowDraftResponse> getMyWorkflows(WorkflowStatus status, Pageable pageable) {
        Long currentUserId = securityService.getCurrentUserId();
        Page<WorkflowEntity> workflows = status == null
                ? workflowRepository.findByCreatedById(currentUserId, pageable)
                : workflowRepository.findByCreatedByIdAndStatus(currentUserId, status, pageable);

        List<WorkflowDraftResponse> data = workflows.getContent().stream()
                .map(this::toWorkflowDraftResponse)
                .toList();

        return new PageResponse<>(
                data,
                workflows.getNumber(),
                workflows.getSize(),
                workflows.getTotalElements(),
                workflows.getTotalPages());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WorkflowDraftResponse> explorePublicWorkflows(String keyword, Pageable pageable) {
        Pageable effectivePageable = pageable.getSort().isUnsorted()
                ? PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "publishedAt"))
                : pageable;

        String normalizedKeyword = keyword != null ? keyword.trim() : null;
        Page<WorkflowEntity> workflows = (normalizedKeyword == null || normalizedKeyword.isEmpty())
                ? workflowRepository.findByStatus(WorkflowStatus.PUBLIC, effectivePageable)
                : workflowRepository.searchByStatusAndKeyword(WorkflowStatus.PUBLIC, normalizedKeyword, effectivePageable);
        List<WorkflowDraftResponse> data = workflows.getContent().stream()
                .map(this::toWorkflowDraftResponse)
                .toList();

        return new PageResponse<>(
                data,
                workflows.getNumber(),
                workflows.getSize(),
                workflows.getTotalElements(),
                workflows.getTotalPages());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDraftResponse getWorkflowDetail(Long workflowId) {
        WorkflowEntity workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

        if (workflow.getStatus() == WorkflowStatus.PUBLIC) {
            return toWorkflowDraftResponse(workflow);
        }

        Long currentUserId = getCurrentUserIdOrNull();
        if (workflow.getStatus() == WorkflowStatus.DRAFT) {
            if (currentUserId == null) {
                throw new ResourceNotFoundException("Workflow not found");
            }
            if (!workflow.getCreatedBy().getId().equals(currentUserId)) {
                throw new AccessDeniedException("You do not have permission to access this workflow");
            }
            return toWorkflowDraftResponse(workflow);
        }

        throw new ResourceNotFoundException("Workflow not found");
    }

    @Override
    @Transactional
    public WorkflowRatingResponse upsertWorkflowRating(Long workflowId, UpsertWorkflowRatingRequest request) {
        WorkflowEntity workflow = getPublicWorkflowOrThrow(workflowId);
        UserEntity currentUser = securityService.getCurrentUser();

        if (workflow.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You cannot rate your own workflow");
        }

        WorkflowRatingEntity rating = workflowRatingRepository.findByWorkflowIdAndUserId(workflowId, currentUser.getId())
                .orElseGet(() -> WorkflowRatingEntity.builder()
                        .workflow(workflow)
                        .user(currentUser)
                        .build());

        String reviewText = request.getReviewText();
        if (reviewText != null) {
            reviewText = reviewText.trim();
            if (reviewText.isBlank()) {
                reviewText = null;
            }
        }

        rating.setStars(request.getStars());
        rating.setReviewText(reviewText);

        WorkflowRatingEntity saved = workflowRatingRepository.save(rating);
        return toWorkflowRatingResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowRatingSummaryResponse getWorkflowRatingSummary(Long workflowId) {
        getPublicWorkflowOrThrow(workflowId);

        Double averageStars = workflowRatingRepository.findAverageStarsByWorkflowId(workflowId);
        long totalRatings = workflowRatingRepository.countByWorkflowId(workflowId);

        return WorkflowRatingSummaryResponse.builder()
                .workflowId(workflowId)
                .averageStars(averageStars)
                .totalRatings(totalRatings)
                .build();
    }

    @Override
    @Transactional
    public WorkflowFavoriteToggleResponse toggleWorkflowFavorite(Long workflowId) {
        WorkflowEntity workflow = getPublicWorkflowOrThrow(workflowId);
        UserEntity currentUser = securityService.getCurrentUser();
        Long currentUserId = currentUser.getId();

        if (workflowFavoriteRepository.existsByWorkflowIdAndUserId(workflowId, currentUserId)) {
            workflowFavoriteRepository.deleteByWorkflowIdAndUserId(workflowId, currentUserId);
            return WorkflowFavoriteToggleResponse.builder()
                    .workflowId(workflowId)
                    .favorited(false)
                    .build();
        }

        workflowFavoriteRepository.save(WorkflowFavoriteEntity.builder()
                .workflow(workflow)
                .user(currentUser)
                .build());

        return WorkflowFavoriteToggleResponse.builder()
                .workflowId(workflowId)
                .favorited(true)
                .build();
    }

    private WorkflowStepTaskSummaryResponse toTaskSummary(TaskEntity task) {
        return WorkflowStepTaskSummaryResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .status(task.getStatus())
                .sprintId(task.getSprint() != null ? task.getSprint().getId() : null)
                .parentTaskId(task.getParentTask() != null ? task.getParentTask().getId() : null)
                .build();
    }

    private WorkflowEntity getOwnedWorkflowOrThrow(Long workflowId) {
        Long currentUserId = securityService.getCurrentUserId();
        return workflowRepository.findByIdAndCreatedById(workflowId, currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
    }

    private WorkflowEntity getPublicWorkflowOrThrow(Long workflowId) {
        return workflowRepository.findByIdAndStatus(workflowId, WorkflowStatus.PUBLIC)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
    }

    private Long getCurrentUserIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }

        try {
            return securityService.getCurrentUserId();
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private WorkflowDraftResponse toWorkflowDraftResponse(WorkflowEntity workflow) {
        List<WorkflowStepEntity> steps = workflowStepRepository
                .findAllByWorkflowIdOrderByPositionAscIdAsc(workflow.getId());
        if (steps.isEmpty()) {
            return toWorkflowDraftResponse(workflow, Collections.emptyList());
        }

        List<Long> stepIds = steps.stream().map(WorkflowStepEntity::getId).toList();
        List<WorkflowStepTaskEntity> stepTasks = workflowStepTaskRepository.findAllByWorkflowStepIdIn(stepIds);

        Map<Long, List<TaskEntity>> tasksByStepId = new HashMap<>();
        for (WorkflowStepTaskEntity stepTask : stepTasks) {
            tasksByStepId.computeIfAbsent(stepTask.getWorkflowStep().getId(), ignored -> new ArrayList<>())
                    .add(stepTask.getTask());
        }

        List<WorkflowStepResponse> stepResponses = steps.stream()
                .map(step -> {
                    List<TaskEntity> tasks = tasksByStepId.getOrDefault(step.getId(), Collections.emptyList());
                    List<WorkflowStepTaskSummaryResponse> taskResponses = tasks.stream()
                            .map(this::toTaskSummary)
                            .toList();
                    return WorkflowStepResponse.builder()
                            .id(step.getId())
                            .title(step.getTitle())
                            .description(step.getDescription())
                            .position(step.getPosition())
                            .sourceType(step.getSourceType())
                            .sourceSprintId(step.getSourceSprint() != null ? step.getSourceSprint().getId() : null)
                            .tasks(taskResponses)
                            .build();
                })
                .toList();

        return toWorkflowDraftResponse(workflow, stepResponses);
    }

    private WorkflowDraftResponse toWorkflowDraftResponse(WorkflowEntity workflow, List<WorkflowStepResponse> steps) {
        return WorkflowDraftResponse.builder()
                .id(workflow.getId())
                .projectId(workflow.getProject().getId())
                .createdBy(workflow.getCreatedBy().getId())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .status(workflow.getStatus())
                .generationSource(workflow.getGenerationSource())
                .aiRefinementRequested(workflow.getAiRefinementRequested())
                .publishedAt(workflow.getPublishedAt())
                .publicationVersion(workflow.getPublicationVersion())
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .steps(steps)
                .build();
    }

    private WorkflowRatingResponse toWorkflowRatingResponse(WorkflowRatingEntity rating) {
        return WorkflowRatingResponse.builder()
                .workflowId(rating.getWorkflow().getId())
                .userId(rating.getUser().getId())
                .stars(rating.getStars())
                .reviewText(rating.getReviewText())
                .createdAt(rating.getCreatedAt())
                .updatedAt(rating.getUpdatedAt())
                .build();
    }

    private List<StepDraft> buildSprintBasedSteps(List<TaskEntity> tasks, List<SprintEntity> sprints) {
        List<StepDraft> steps = new ArrayList<>();

        for (SprintEntity sprint : sprints) {
            List<TaskEntity> sprintTasks = tasks.stream()
                    .filter(task -> task.getSprint() != null && task.getSprint().getId()
                            .equals(sprint.getId()))
                    .toList();
            if (sprintTasks.isEmpty()) {
                continue;
            }

            String description = sprint.getGoal() != null && !sprint.getGoal().isBlank()
                    ? sprint.getGoal()
                    : "Generated from sprint";

            steps.add(new StepDraft(
                    sprint.getName(),
                    description,
                    "SPRINT",
                    sprint,
                    sprintTasks));
        }

        List<TaskEntity> backlogTasks = tasks.stream()
                .filter(task -> task.getSprint() == null)
                .toList();
        if (!backlogTasks.isEmpty()) {
            steps.add(new StepDraft(
                    "Backlog",
                    "Tasks without sprint",
                    "BACKLOG",
                    null,
                    backlogTasks));
        }

        return steps;
    }

    private List<StepDraft> buildStatusBasedSteps(List<TaskEntity> tasks) {
        Map<TaskStatus, List<TaskEntity>> grouped = new EnumMap<>(TaskStatus.class);
        for (TaskStatus status : List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE)) {
            grouped.put(status, new ArrayList<>());
        }

        for (TaskEntity task : tasks) {
            List<TaskEntity> bucket = grouped.get(task.getStatus());
            if (bucket != null) {
                bucket.add(task);
            }
        }

        List<StepDraft> steps = new ArrayList<>();
        for (TaskStatus status : List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.DONE)) {
            List<TaskEntity> statusTasks = grouped.get(status);
            if (statusTasks == null || statusTasks.isEmpty()) {
                continue;
            }

            steps.add(new StepDraft(
                    mapStatusTitle(status),
                    "Generated from task status",
                    "STATUS",
                    null,
                    statusTasks));
        }

        return steps;
    }

    private String mapStatusTitle(TaskStatus status) {
        return switch (status) {
            case TODO -> "Planning & Backlog";
            case IN_PROGRESS -> "Implementation";
            case REVIEW -> "Review & QA";
            case DONE -> "Completed";
        };
    }

    private record StepDraft(
            String title,
            String description,
            String sourceType,
            SprintEntity sourceSprint,
            List<TaskEntity> tasks) {
    }
}
