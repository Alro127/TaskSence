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
import dev.alro127.tasksense.repository.jpa.WorkflowRepository;
import dev.alro127.tasksense.security.permission.EffectivePermissionResolver;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkflowService;
import dev.alro127.tasksense.service.WorkspaceService;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final WorkspaceInviteRepository workspaceInviteRepository;
    private final WorkflowService workflowService;
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
        permissionResolver.evictAllPermissionCache();

        return toResponse(saved);
    }

    @Override
    public WorkspaceResponse getWorkspaceById(Long id) {
        WorkspaceEntity workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        return toResponse(workspace);
    }

    @Override
    public PageResponse<WorkspaceResponse> getMyWorkspaces(Pageable pageable) {
        UserEntity currentUser = securityService.getCurrentUser();

        Page<WorkspaceEntity> workspacePage = workspaceRepository.findAllByMemberUserId(currentUser.getId(), pageable);

        // ✅ Lấy list ID
        List<Long> workspaceIds = workspacePage.getContent()
                .stream()
                .map(WorkspaceEntity::getId)
                .toList();

        // ✅ Query 1 lần
        Map<Long, Long> countMap = toCountMap(
                projectRepository.countByWorkspaceIds(workspaceIds));

        // ✅ Map sang response
        Page<WorkspaceResponse> responsePage = workspacePage.map(workspace -> {
            WorkspaceResponse res = WorkspaceResponse.mapToResponse(workspace);

            res.setProjectCount(countMap.getOrDefault(workspace.getId(), 0L));

            res.setPermissions(
                    permissionResolver.resolveWorkspacePermissions(
                            securityService.getCurrentUserId(),
                            workspace.getId()));

            return res;
        });

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

        return toResponse(workspace);
    }

    @Override
    @Transactional
    public void deleteWorkspace(Long id) {
        WorkspaceEntity workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // @PreAuthorize đã đảm bảo chỉ OWNER mới gọi được

        OffsetDateTime now = OffsetDateTime.now();

        // Cascade soft delete: tasks → project members → workflows → projects →
        // workspace members →
        // invites → workspace
        List<Long> projectIds = projectRepository.findIdsByWorkspaceId(id);
        if (!projectIds.isEmpty()) {
            taskRepository.softDeleteByProjectIds(projectIds, now);
            projectMemberRepository.softDeleteByProjectIds(projectIds, now);
            workflowService.deleteWorkflowsByProjectIds(projectIds, now);
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
                .map(this::toResponse)
                .toList();
    }

    @Override
    public PageResponse<WorkspaceResponse> getPublicWorkspaces(Long userId, Pageable pageable) {

        Page<WorkspaceResponse> responsePage = workspaceRepository.findPublicWorkspacesByOwner(userId, pageable)
                .map(this::toResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    private Map<Long, Long> toCountMap(List<Object[]> results) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : results) {
            Long workspaceId = (Long) row[0];
            Long count = (Long) row[1];
            map.put(workspaceId, count);
        }
        return map;
    }

    private WorkspaceResponse toResponse(WorkspaceEntity workspace) {
        Long currentUserId = securityService.getCurrentUserId();
        WorkspaceResponse response = WorkspaceResponse.mapToResponse(workspace);
        response.setProjectCount(
                projectRepository.countByWorkspaceId(workspace.getId()));
        response.setPermissions(permissionResolver.resolveWorkspacePermissions(currentUserId, workspace.getId()));
        return response;
    }
}
