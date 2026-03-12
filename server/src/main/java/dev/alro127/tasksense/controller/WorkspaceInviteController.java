package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateBulkWorkspaceInviteRequest;
import dev.alro127.tasksense.dto.request.TokenRequest;
import dev.alro127.tasksense.dto.request.BulkInviteItemRequest;
import dev.alro127.tasksense.dto.response.BulkInviteResult;
import dev.alro127.tasksense.dto.response.WorkspaceInviteResponse;
import dev.alro127.tasksense.service.WorkspaceInviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceInviteController {

        private final WorkspaceInviteService workspaceInviteService;

        @PostMapping("/{workspaceId}/invites")
        @PreAuthorize("@perm.workspace(#workspaceId, 'INVITE_MEMBERS')")
        public ResponseEntity<ApiResponse<WorkspaceInviteResponse>> inviteMember(
                        @PathVariable Long workspaceId,
                        @Valid @RequestBody BulkInviteItemRequest request) {

                ApiResponse<WorkspaceInviteResponse> response = new ApiResponse<>(
                                "201",
                                "Invite member successfully",
                                workspaceInviteService.inviteMember(workspaceId, request),
                                null);

                return ResponseEntity.status(201).body(response);
        }

        @PostMapping("/{workspaceId}/invites/bulk")
        @PreAuthorize("@perm.workspace(#workspaceId, 'INVITE_MEMBERS')")
        public ResponseEntity<ApiResponse<BulkInviteResult>> inviteMultipleMembers(
                        @PathVariable Long workspaceId,
                        @Valid @RequestBody CreateBulkWorkspaceInviteRequest request) {

                ApiResponse<BulkInviteResult> response = new ApiResponse<>(
                                "201",
                                "Invite multiple members successfully",
                                workspaceInviteService.inviteMultipleMembers(workspaceId, request),
                                null);

                return ResponseEntity.status(201).body(response);
        }

        @GetMapping("/{workspaceId}/invites")
        @PreAuthorize("@perm.workspace(#workspaceId, 'INVITE_MEMBERS')")
        public ResponseEntity<ApiResponse<PageResponse<WorkspaceInviteResponse>>> getWorkspaceInvites(
                        @PathVariable Long workspaceId,
                        Pageable pageable) {

                ApiResponse<PageResponse<WorkspaceInviteResponse>> response = new ApiResponse<>(
                                "200",
                                "Get workspace invites successfully",
                                workspaceInviteService.getWorkspaceInvites(workspaceId, pageable),
                                null);

                return ResponseEntity.ok(response);
        }

        @PostMapping("/invites/accept")
        public ResponseEntity<ApiResponse<WorkspaceInviteResponse>> acceptInvite(
                        @Valid @RequestBody TokenRequest request) {

                ApiResponse<WorkspaceInviteResponse> response = new ApiResponse<>(
                                "200",
                                "Accept workspace invite successfully",
                                workspaceInviteService.acceptInvite(request.getToken()),
                                null);

                return ResponseEntity.ok(response);
        }

        @PatchMapping("/invites/{inviteId}/revoke")
        public ResponseEntity<ApiResponse<Void>> revokeInvite(
                        @PathVariable Long inviteId) {

                workspaceInviteService.revokeInvite(inviteId);

                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Revoke workspace invite successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }
}
