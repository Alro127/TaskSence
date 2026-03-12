package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.dto.request.UpdateProjectRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ProjectService {

    ProjectResponse createProject(Long workspaceId, CreateProjectRequest request);

    ProjectResponse getProjectById(Long workspaceId, Long projectId);

    // List<ProjectResponse> getProjectsByWorkspace(Long workspaceId);

    PageResponse<ProjectResponse> getProjectsByWorkspace(Long workspaceId, Pageable pageable);

    ProjectResponse updateProject(Long workspaceId, Long projectId, UpdateProjectRequest request);

    void deleteProject(Long workspaceId, Long projectId);
}
