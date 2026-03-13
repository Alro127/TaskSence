package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRequest;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface WorkspaceService {

    WorkspaceResponse createWorkspace(CreateWorkspaceRequest request);

    WorkspaceResponse getWorkspaceById(Long id);

    PageResponse<WorkspaceResponse> getMyWorkspaces(Pageable pageable);

    WorkspaceResponse updateWorkspace(Long id, UpdateWorkspaceRequest request);

    void deleteWorkspace(Long id);

    List<WorkspaceResponse> searchWorkspaces(String name, Long cursor, int limit);

    List<WorkspaceResponse> getPublicWorkspaces(Long userId);
}
