package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateProjectRequest;
import dev.alro127.tasksense.dto.request.UpdateProjectRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.service.ProjectMemberService;
import dev.alro127.tasksense.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workspaces/{workspaceId}/projects")
@RequiredArgsConstructor
public class ProjectController {

        private final ProjectService projectService;
        private final ProjectMemberService projectMemberService;

        @PostMapping
        @PreAuthorize("@perm.workspace(#workspaceId, 'CREATE_PROJECT')")
        public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
                        @PathVariable Long workspaceId,
                        @Valid @RequestBody CreateProjectRequest request) {

                ApiResponse<ProjectResponse> response = new ApiResponse<>(
                                "201",
                                "Create project successfully",
                                projectService.createProject(workspaceId, request),
                                null);

                return ResponseEntity.status(201).body(response);
        }

        @GetMapping
        @PreAuthorize("@perm.workspace(#workspaceId, 'VIEW')")
        public ResponseEntity<ApiResponse<PageResponse<ProjectResponse>>> getProjectsByWorkspace(
                        @PathVariable Long workspaceId,
                        Pageable pageable) {

                ApiResponse<PageResponse<ProjectResponse>> response = new ApiResponse<>(
                                "200",
                                "Get projects successfully",
                                projectService.getProjectsByWorkspace(workspaceId, pageable),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{projectId}")
        @PreAuthorize("@perm.project(#projectId, 'VIEW')")
        public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
                        @PathVariable Long workspaceId,
                        @PathVariable Long projectId) {

                ApiResponse<ProjectResponse> response = new ApiResponse<>(
                                "200",
                                "Get project successfully",
                                projectService.getProjectById(workspaceId, projectId),
                                null);

                return ResponseEntity.ok(response);
        }

        @PutMapping("/{projectId}")
        @PreAuthorize("@perm.project(#projectId, 'UPDATE')")
        public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
                        @PathVariable Long workspaceId,
                        @PathVariable Long projectId,
                        @Valid @RequestBody UpdateProjectRequest request) {

                ApiResponse<ProjectResponse> response = new ApiResponse<>(
                                "200",
                                "Update project successfully",
                                projectService.updateProject(workspaceId, projectId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/{projectId}/leave")
        @PreAuthorize("@perm.project(#projectId, 'VIEW')")
        public ResponseEntity<ApiResponse<Void>> leaveProject(
                @PathVariable Long workspaceId,
                @PathVariable Long projectId) {

                projectMemberService.leaveProject(projectId);

                return ResponseEntity.ok(
                        new ApiResponse<>("200", "Leave project successfully", null, null)
                );
        }

        @DeleteMapping("/{projectId}")
        @PreAuthorize("@perm.project(#projectId, 'DELETE')")
        public ResponseEntity<ApiResponse<Void>> deleteProject(
                        @PathVariable Long workspaceId,
                        @PathVariable Long projectId) {

                projectService.deleteProject(workspaceId, projectId);

                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Delete project successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }
}
