package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.dto.request.UpdateProjectRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowRepository;
import dev.alro127.tasksense.security.permission.EffectivePermissionResolver;
import dev.alro127.tasksense.event.EntityChangedEvent;
import dev.alro127.tasksense.event.EntityChangedEvent.Operation;
import dev.alro127.tasksense.service.ProjectService;
import dev.alro127.tasksense.service.SearchIndexService;
import dev.alro127.tasksense.service.SecurityService;

import dev.alro127.tasksense.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final WorkflowService workflowService;
    private final SecurityService securityService;
    private final EffectivePermissionResolver permissionResolver;
    private final ApplicationEventPublisher eventPublisher;
    private final SearchIndexService searchIndexService;

    @Override
    @Transactional
    public ProjectResponse createProject(Long workspaceId, CreateProjectRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();
        // @PreAuthorize đã kiểm tra CREATE_PROJECT permission (chỉ OWNER)

        WorkspaceEntity workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        ProjectEntity project = ProjectEntity.builder()
                .workspace(workspace)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .status(request.getStatus() != null ? request.getStatus()
                        : dev.alro127.tasksense.domain.enums.ProjectStatus.ACTIVE)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        ProjectMemberEntity owner = ProjectMemberEntity.builder()
                .project(project)
                .user(currentUser)
                .role(ProjectMemberRole.MANAGER) // temporary setting
                .build();

        projectRepository.save(project);
        projectMemberRepository.save(owner);
        permissionResolver.evictAllPermissionCache();

        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.PROJECT, project.getId(), Operation.UPSERT));
        return toResponse(project);
    }

    @Override
    public ProjectResponse getProjectById(Long workspaceId, Long projectId) {
        // @PreAuthorize đã kiểm tra project VIEW permission

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectBelongsToWorkspace(project, workspaceId);

        return toResponse(project);
    }

    @Override
    public PageResponse<ProjectResponse> getProjectsByWorkspace(
            Long workspaceId, Pageable pageable) {

        workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        Page<ProjectEntity> projectPage = projectRepository.findAllByWorkspaceId(workspaceId, pageable);

        List<ProjectEntity> projects = projectPage.getContent();

        // ✅ Lấy list project IDs
        List<Long> projectIds = projects.stream()
                .map(ProjectEntity::getId)
                .toList();

        // ✅ Batch query
        Map<Long, Long> totalTaskMap = toCountMap(taskRepository.countByProjectIds(projectIds));

        Map<Long, Long> doneTaskMap = toCountMap(taskRepository.countDoneByProjectIds(projectIds, TaskStatus.DONE));

        Long currentUserId = securityService.getCurrentUserId();

        List<ProjectResponse> data = projects.stream()
                .map(project -> {
                    ProjectResponse res = ProjectResponse.mapToResponse(project);

                    long total = totalTaskMap.getOrDefault(project.getId(), 0L);
                    long done = doneTaskMap.getOrDefault(project.getId(), 0L);

                    res.setTaskCount(total);

                    res.setProgress(
                            total != 0
                                    ? (float) ((done * 100.0) / total)
                                    : 0);

                    res.setPermissions(
                            permissionResolver.resolveProjectPermissions(
                                    currentUserId,
                                    project.getId()));

                    return res;
                })
                .toList();

        return new PageResponse<>(
                data,
                projectPage.getNumber(),
                projectPage.getSize(),
                projectPage.getTotalElements(),
                projectPage.getTotalPages());
    }

    @Override
    public ProjectResponse updateProject(Long workspaceId, Long projectId, UpdateProjectRequest request) {
        // @PreAuthorize đã kiểm tra project UPDATE permission (MANAGER hoặc WS OWNER)

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectBelongsToWorkspace(project, workspaceId);

        if (request.getName() != null) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription().trim());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }

        projectRepository.save(project);

        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.PROJECT, projectId, Operation.UPSERT));
        return toResponse(project);
    }

    @Override
    @Transactional
    public void deleteProject(Long workspaceId, Long projectId) {
        // @PreAuthorize đã kiểm tra project DELETE permission (MANAGER hoặc WS OWNER)

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectBelongsToWorkspace(project, workspaceId);

        OffsetDateTime now = OffsetDateTime.now();

        // Cascade soft delete: tasks → project members → workflows → project
        taskRepository.softDeleteByProjectId(projectId, now);
        projectMemberRepository.softDeleteByProjectId(projectId, now);
        workflowService.deleteWorkflowsByProjectIds(List.of(projectId), now);

        project.setDeletedAt(now);
        projectRepository.save(project);

        // Xóa khỏi ES — best-effort, cascade delete không đi qua event
        try {
            searchIndexService.removeTasksByProject(projectId);
            searchIndexService.removeCommentsByProject(projectId);
        } catch (Exception e) {
            log.error("Failed to remove tasks/comments from ES for projectId={}", projectId, e);
        }
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.PROJECT, projectId, Operation.DELETE));
    }

    // ---- helpers ----

    private void validateProjectBelongsToWorkspace(ProjectEntity project, Long workspaceId) {
        if (!project.getWorkspace().getId().equals(workspaceId)) {
            throw new ResourceNotFoundException("Project not found");
        }
    }

    private Map<Long, Long> toCountMap(List<Object[]> results) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : results) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    private ProjectResponse toResponse(ProjectEntity project) {
        Long currentUserId = securityService.getCurrentUserId();
        ProjectResponse response = ProjectResponse.mapToResponse(project);

        Long taskCount = taskRepository.countByProjectId(project.getId());
        response.setProgress(taskCount != 0
                ? (taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.DONE) / taskCount) * 100
                : 0);
        response.setTaskCount(taskCount);
        response.setPermissions(permissionResolver.resolveProjectPermissions(currentUserId, project.getId()));
        return response;
    }
}
