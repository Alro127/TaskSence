package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRequest;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final SecurityService securityService;

    @Override
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

        return WorkspaceResponse.mapToResponse(workspace);
    }

    @Override
    public WorkspaceResponse getWorkspaceById(Long id) {
        WorkspaceEntity workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // @PreAuthorize đã đảm bảo user là workspace member
        return WorkspaceResponse.mapToResponse(workspace);
    }

    @Override
    public List<WorkspaceResponse> getMyWorkspaces() {
        UserEntity currentUser = securityService.getCurrentUser();

        return workspaceRepository.findAllByMemberUserId(currentUser.getId())
                .stream()
                .map(WorkspaceResponse::mapToResponse)
                .toList();
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

        return WorkspaceResponse.mapToResponse(workspace);
    }

    @Override
    public void deleteWorkspace(Long id) {
        WorkspaceEntity workspace = workspaceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        // @PreAuthorize đã đảm bảo chỉ OWNER mới gọi được
        workspace.setDeletedAt(OffsetDateTime.now());

        workspaceRepository.save(workspace);
    }

    @Override
    public List<WorkspaceResponse> searchWorkspaces(String name, Long cursor, int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        List<WorkspaceEntity> workspaces = workspaceRepository.searchWorkspaces(name, cursor, pageable);

        return workspaces.stream()
                .map(WorkspaceResponse::mapToResponse)
                .toList();
    }

    @Override
    public List<WorkspaceResponse> getPublicWorkspaces(Long userId) {

        List<WorkspaceEntity> workspaces = workspaceRepository.findPublicWorkspacesByOwner(userId);

        return workspaces.stream()
                .map(WorkspaceResponse::mapToResponse)
                .toList();
    }
}
