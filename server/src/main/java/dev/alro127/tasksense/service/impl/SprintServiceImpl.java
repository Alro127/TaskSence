package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.SprintEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.GuidanceConditionType;
import dev.alro127.tasksense.domain.enums.SprintStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.projection.SprintTaskStats;
import dev.alro127.tasksense.dto.request.CreateSprintRequest;
import dev.alro127.tasksense.dto.request.UpdateSprintRequest;
import dev.alro127.tasksense.dto.response.SprintResponse;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.SprintRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.security.permission.PermissionChecker;
import dev.alro127.tasksense.security.permission.ProjectPermission;
import dev.alro127.tasksense.service.ProjectGuidanceService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.SprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SprintServiceImpl implements SprintService {

        private final SprintRepository sprintRepository;
        private final ProjectRepository projectRepository;
        private final TaskRepository taskRepository;
        private final SecurityService securityService;
        private final PermissionChecker permissionChecker;
        private final ProjectGuidanceService projectGuidanceService;

        @Override
        @Transactional
        public SprintResponse createSprint(CreateSprintRequest request) {

                permissionChecker.requireProjectPermission(request.getProjectId(), ProjectPermission.CREATE_SPRINT);

                ProjectEntity project = projectRepository.findById(request.getProjectId())
                                .orElseThrow(() -> new RuntimeException("Project not found"));

                UserEntity currentUser = securityService.getCurrentUser();

                SprintEntity sprint = SprintEntity.builder()
                                .project(project)
                                .name(request.getName())
                                .goal(request.getGoal())
                                .status(SprintStatus.PLANNING)
                                .startDate(request.getStartDate())
                                .endDate(request.getEndDate())
                                .createdBy(currentUser)
                                .build();

                sprintRepository.save(sprint);

                projectGuidanceService.reportAction(request.getProjectId(), GuidanceConditionType.SPRINT_CREATED, Map.of("sprintId", sprint.getId()));

                return SprintResponse.mapToResponse(sprint, 0L, 0L);
        }

        @Override
        @Transactional
        public SprintResponse updateSprint(Long sprintId, UpdateSprintRequest request) {

                SprintEntity sprint = sprintRepository.findById(sprintId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

                permissionChecker.requireProjectPermission(sprint.getProject().getId(),
                                ProjectPermission.UPDATE_SPRINT);

                sprint.setName(request.getName());
                sprint.setGoal(request.getGoal());

                if (request.getStartDate() != null) {
                        sprint.setStartDate(request.getStartDate());
                }

                if (request.getEndDate() != null) {
                        sprint.setEndDate(request.getEndDate());
                }

                SprintTaskStats stats = taskRepository.getSprintTaskStats(sprintId);

                long taskCount = stats == null || stats.getTaskCount() == null ? 0 : stats.getTaskCount();
                long completed = stats == null || stats.getCompletedTaskCount() == null ? 0
                                : stats.getCompletedTaskCount();

                return SprintResponse.mapToResponse(sprint, taskCount, completed);
        }

        @Override
        @Transactional
        public void deleteSprint(Long sprintId) {

                SprintEntity sprint = sprintRepository.findById(sprintId)
                                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));

                permissionChecker.requireProjectPermission(sprint.getProject().getId(),
                                ProjectPermission.DELETE_SPRINT);

                sprint.setDeletedAt(OffsetDateTime.now());
        }

        @Override
        public PageResponse<SprintResponse> getProjectSprints(Long projectId, Pageable pageable) {

                permissionChecker.requireProjectPermission(projectId, ProjectPermission.VIEW_SPRINTS);

                Page<SprintEntity> sprintPage = sprintRepository.findByProjectId(projectId, pageable);

                List<Long> sprintIds = sprintPage
                                .getContent()
                                .stream()
                                .map(SprintEntity::getId)
                                .toList();

                List<SprintTaskStats> statsList = taskRepository.getSprintTaskStatsBySprintIds(sprintIds);

                Map<Long, SprintTaskStats> statsMap = statsList.stream()
                                .collect(Collectors.toMap(SprintTaskStats::getSprintId, s -> s));

                List<SprintResponse> responses = sprintPage
                                .getContent()
                                .stream()
                                .map(sprint -> {

                                        SprintTaskStats stats = statsMap.get(sprint.getId());

                                        long taskCount = stats == null || stats.getTaskCount() == null
                                                        ? 0
                                                        : stats.getTaskCount();

                                        long completed = stats == null || stats.getCompletedTaskCount() == null
                                                        ? 0
                                                        : stats.getCompletedTaskCount();

                                        return SprintResponse.mapToResponse(sprint, taskCount, completed);
                                })
                                .toList();

                return new PageResponse<>(
                                responses,
                                sprintPage.getNumber(),
                                sprintPage.getSize(),
                                sprintPage.getTotalElements(),
                                sprintPage.getTotalPages());
        }
}