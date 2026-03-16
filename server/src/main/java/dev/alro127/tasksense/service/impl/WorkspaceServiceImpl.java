package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRequest;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceInviteRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.security.permission.EffectivePermissionResolver;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkspaceService;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final WorkspaceInviteRepository workspaceInviteRepository;
    private final SecurityService securityService;
    private final EffectivePermissionResolver permissionResolver;

    @Override
    @Transactional
    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();

        WorkspaceEntity workspace = WorkspaceEntity.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .owner(currentUser)
                .isPublic(request.getIsPublic())
                .build();

        WorkspaceEntity saved = workspaceRepository.save(workspace);

        WorkspaceMemberEntity member = WorkspaceMemberEntity.builder()
                .workspace(saved)
                .user(currentUser)
                .role(WorkspaceRole.OWNER)
                .joinedAt(OffsetDateTime.now())
                .build();

        workspaceMemberRepository.save(member);

        return toResponseWithPermissions(saved);
    }

    @Override
    public WorkspaceResponse getWorkspaceById(Long id) {
        WorkspaceEntity workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // @PreAuthorize đã đảm bảo user là workspace member
        return toResponseWithPermissions(workspace);
    }

    @Override
    public PageResponse<WorkspaceResponse> getMyWorkspaces(Pageable pageable) {
        UserEntity currentUser = securityService.getCurrentUser();

        Page<WorkspaceResponse> responsePage = workspaceRepository.findAllByMemberUserId(currentUser.getId(), pageable)
                .map(this::toResponseWithPermissions);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    public WorkspaceResponse updateWorkspace(Long id, UpdateWorkspaceRequest request) {
        WorkspaceEntity workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // @PreAuthorize đã đảm bảo chỉ OWNER mới gọi được

        if (request.getName() != null) {
            workspace.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            workspace.setDescription(request.getDescription().trim());
        }

        if (request.getIsPublic() != null) {
            workspace.setIsPublic(request.getIsPublic());
        }

        workspaceRepository.save(workspace);

        return toResponseWithPermissions(workspace);
    }

    @Override
    @Transactional
    public void deleteWorkspace(Long id) {
        WorkspaceEntity workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // @PreAuthorize đã đảm bảo chỉ OWNER mới gọi được

        OffsetDateTime now = OffsetDateTime.now();

        // Cascade soft delete: tasks → project members → projects → workspace members →
        // invites → workspace
        List<Long> projectIds = projectRepository.findIdsByWorkspaceId(id);
        if (!projectIds.isEmpty()) {
            taskRepository.softDeleteByProjectIds(projectIds, now);
            projectMemberRepository.softDeleteByProjectIds(projectIds, now);
        }
        projectRepository.softDeleteByWorkspaceId(id, now);
        workspaceMemberRepository.softDeleteByWorkspaceId(id, now);
        workspaceInviteRepository.softDeleteByWorkspaceId(id, now);

        workspace.setDeletedAt(now);
        workspaceRepository.save(workspace);
    }

    @Override
    public List<WorkspaceResponse> searchWorkspaces(String name, Long cursor, int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        List<WorkspaceEntity> workspaces = workspaceRepository.searchWorkspaces(name, cursor, pageable);

        return workspaces.stream()
                .map(this::toResponseWithPermissions)
                .toList();
    }

    @Override
    public PageResponse<WorkspaceResponse> getPublicWorkspaces(Long userId, Pageable pageable) {

        Page<WorkspaceResponse> responsePage = workspaceRepository.findPublicWorkspacesByOwner(userId, pageable)
                .map(this::toResponseWithPermissions);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    private WorkspaceResponse toResponseWithPermissions(WorkspaceEntity workspace) {
        Long currentUserId = securityService.getCurrentUserId();
        WorkspaceResponse response = WorkspaceResponse.mapToResponse(workspace);
        response.setPermissions(permissionResolver.resolveWorkspacePermissions(currentUserId, workspace.getId()));
        return response;
    }
}
