package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRequest;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    @Override
    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request) {
        UserEntity currentUser = getCurrentUser();

        WorkspaceEntity workspace = WorkspaceEntity.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .owner(currentUser)
                .build();

        workspaceRepository.save(workspace);

        return mapToResponse(workspace);
    }

    @Override
    public WorkspaceResponse getWorkspaceById(Long id) {
        UserEntity currentUser = getCurrentUser();

        WorkspaceEntity workspace = workspaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        validateWorkspaceOwnership(workspace, currentUser.getId());

        return mapToResponse(workspace);
    }

    @Override
    public List<WorkspaceResponse> getMyWorkspaces() {
        UserEntity currentUser = getCurrentUser();

        return workspaceRepository.findAllByOwnerIdAndDeletedAtIsNull(currentUser.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public WorkspaceResponse updateWorkspace(Long id, UpdateWorkspaceRequest request) {
        UserEntity currentUser = getCurrentUser();

        WorkspaceEntity workspace = workspaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        validateWorkspaceOwnership(workspace, currentUser.getId());

        if (request.getName() != null) {
            workspace.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            workspace.setDescription(request.getDescription().trim());
        }

        workspaceRepository.save(workspace);

        return mapToResponse(workspace);
    }

    @Override
    public void deleteWorkspace(Long id) {
        UserEntity currentUser = getCurrentUser();

        WorkspaceEntity workspace = workspaceRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        validateWorkspaceOwnership(workspace, currentUser.getId());

        workspace.setDeletedAt(OffsetDateTime.now());

        workspaceRepository.save(workspace);
    }

    private UserEntity getCurrentUser() {
        String email = getCurrentUserEmail();

        return userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String getCurrentUserEmail() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        assert authentication != null;
        return authentication.getName();
    }

    private void validateWorkspaceOwnership(WorkspaceEntity workspace, Long userId) {
        if (!workspace.getOwner().getId().equals(userId)) {
            throw new BadRequestException("You are not allowed to access this workspace");
        }
    }

    private WorkspaceResponse mapToResponse(WorkspaceEntity workspace) {
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .ownerId(workspace.getOwner().getId())
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }
}
