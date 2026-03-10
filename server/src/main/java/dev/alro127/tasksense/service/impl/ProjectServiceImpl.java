package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.dto.request.UpdateProjectRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.service.ProjectService;
import dev.alro127.tasksense.service.SecurityService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SecurityService securityService;

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

        return ProjectResponse.mapToResponse(project);
    }

    @Override
    public ProjectResponse getProjectById(Long workspaceId, Long projectId) {
        // @PreAuthorize đã kiểm tra project VIEW permission

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectBelongsToWorkspace(project, workspaceId);

        return ProjectResponse.mapToResponse(project);
    }

    @Override
    public List<ProjectResponse> getProjectsByWorkspace(Long workspaceId) {
        UserEntity currentUser = securityService.getCurrentUser();
        // @PreAuthorize đã kiểm tra workspace VIEW permission

        workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        return projectRepository.findAllByWorkspaceIdAndMemberId(workspaceId, currentUser.getId())
                .stream()
                .map(ProjectResponse::mapToResponse)
                .toList();
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

        return ProjectResponse.mapToResponse(project);
    }

    @Override
    public void deleteProject(Long workspaceId, Long projectId) {
        // @PreAuthorize đã kiểm tra project DELETE permission (MANAGER hoặc WS OWNER)

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectBelongsToWorkspace(project, workspaceId);

        project.setDeletedAt(OffsetDateTime.now());

        projectRepository.save(project);
    }

    // ---- helpers ----

    private void validateProjectBelongsToWorkspace(ProjectEntity project, Long workspaceId) {
        if (!project.getWorkspace().getId().equals(workspaceId)) {
            throw new ResourceNotFoundException("Project not found");
        }
    }
}
