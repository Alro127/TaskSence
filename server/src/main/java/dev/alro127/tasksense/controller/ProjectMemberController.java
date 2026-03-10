package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.AddProjectMemberRequest;
import dev.alro127.tasksense.dto.request.UpdateProjectMemberRoleRequest;
import dev.alro127.tasksense.dto.response.AddProjectMemberResultItem;
import dev.alro127.tasksense.dto.response.ProjectMemberResponse;
import dev.alro127.tasksense.service.ProjectMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/members")
@RequiredArgsConstructor
public class ProjectMemberController {

        private final ProjectMemberService projectMemberService;

        @PostMapping
        @PreAuthorize("@perm.project(#projectId, 'MANAGE_MEMBERS')")
        public ResponseEntity<ApiResponse<List<AddProjectMemberResultItem>>> addMembers(
                        @PathVariable Long projectId,
                        @Valid @RequestBody AddProjectMemberRequest request) {

                ApiResponse<List<AddProjectMemberResultItem>> response = new ApiResponse<>(
                                "200",
                                "Add project members successfully",
                                projectMemberService.addMembers(projectId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping
        @PreAuthorize("@perm.project(#projectId, 'VIEW_MEMBERS')")
        public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getMembers(
                        @PathVariable Long projectId) {

                ApiResponse<List<ProjectMemberResponse>> response = new ApiResponse<>(
                                "200",
                                "Get project members successfully",
                                projectMemberService.getMembers(projectId),
                                null);

                return ResponseEntity.ok(response);
        }

        @PatchMapping("/{userId}/role")
        @PreAuthorize("@perm.project(#projectId, 'MANAGE_MEMBERS')")
        public ResponseEntity<ApiResponse<ProjectMemberResponse>> updateMemberRole(
                        @PathVariable Long projectId,
                        @PathVariable Long userId,
                        @Valid @RequestBody UpdateProjectMemberRoleRequest request) {

                ApiResponse<ProjectMemberResponse> response = new ApiResponse<>(
                                "200",
                                "Update member role successfully",
                                projectMemberService.updateMemberRole(projectId, userId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/me/role")
        public ResponseEntity<ApiResponse<String>> getCurrentUserRole(
                        @PathVariable Long projectId) {

                ApiResponse<String> response = new ApiResponse<>(
                                "200",
                                "Get current user role successfully",
                                projectMemberService.getCurrentUserRole(projectId),
                                null);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/{userId}")
        @PreAuthorize("@perm.project(#projectId, 'MANAGE_MEMBERS')")
        public ResponseEntity<ApiResponse<Void>> removeMember(
                        @PathVariable Long projectId,
                        @PathVariable Long userId) {

                projectMemberService.removeMember(projectId, userId);

                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Remove project member successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }
}
