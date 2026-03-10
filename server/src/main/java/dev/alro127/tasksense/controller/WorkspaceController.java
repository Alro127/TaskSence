package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRequest;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;
import dev.alro127.tasksense.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

        private final WorkspaceService workspaceService;

        @PostMapping
        public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
                        @Valid @RequestBody CreateWorkspaceRequest request) {
                ApiResponse<WorkspaceResponse> response = new ApiResponse<>(
                                "201",
                                "Create workspace successfully",
                                workspaceService.createWorkspace(request),
                                null);

                return ResponseEntity.status(201).body(response);
        }

        @GetMapping
        public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getMyWorkspaces() {
                ApiResponse<List<WorkspaceResponse>> response = new ApiResponse<>(
                                "200",
                                "Get workspaces successfully",
                                workspaceService.getMyWorkspaces(),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{id}")
        @PreAuthorize("@perm.workspace(#id, 'VIEW')")
        public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceById(@PathVariable Long id) {
                ApiResponse<WorkspaceResponse> response = new ApiResponse<>(
                                "200",
                                "Get workspace successfully",
                                workspaceService.getWorkspaceById(id),
                                null);

                return ResponseEntity.ok(response);
        }

        @PutMapping("/{id}")
        @PreAuthorize("@perm.workspace(#id, 'UPDATE')")
        public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateWorkspaceRequest request) {
                ApiResponse<WorkspaceResponse> response = new ApiResponse<>(
                                "200",
                                "Update workspace successfully",
                                workspaceService.updateWorkspace(id, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("@perm.workspace(#id, 'DELETE')")
        public ResponseEntity<ApiResponse<Void>> deleteWorkspace(@PathVariable Long id) {
                workspaceService.deleteWorkspace(id);

                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Delete workspace successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/search")
        public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> searchWorkspaces(
                        @RequestParam String name,
                        @RequestParam(required = false) Long cursor,
                        @RequestParam(defaultValue = "10") int limit) {

                ApiResponse<List<WorkspaceResponse>> response = new ApiResponse<>(
                                "200",
                                "Search workspace successfully",
                                workspaceService.searchWorkspaces(name, cursor, limit),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/public/{userId}")
        public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getPublicWorkspaces(
                        @PathVariable Long userId) {

                ApiResponse<List<WorkspaceResponse>> response = new ApiResponse<>(
                                "200",
                                "Get public workspaces successfully",
                                workspaceService.getPublicWorkspaces(userId),
                                null);

                return ResponseEntity.ok(response);
        }
}
