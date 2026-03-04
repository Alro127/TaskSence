package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.TokenRequest;
import dev.alro127.tasksense.dto.request.CreateWorkspaceInviteRequest;
import dev.alro127.tasksense.dto.response.WorkspaceInviteResponse;
import dev.alro127.tasksense.service.WorkspaceInviteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceInviteController {

    private final WorkspaceInviteService workspaceInviteService;

    @PostMapping("/{workspaceId}/invites")
    public ResponseEntity<ApiResponse<WorkspaceInviteResponse>> inviteMember(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateWorkspaceInviteRequest request) {

        ApiResponse<WorkspaceInviteResponse> response = new ApiResponse<>(
                "201",
                "Invite member successfully",
                workspaceInviteService.inviteMember(workspaceId, request),
                null
        );

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/{workspaceId}/invites")
    public ResponseEntity<ApiResponse<List<WorkspaceInviteResponse>>> getWorkspaceInvites(
            @PathVariable Long workspaceId) {

        ApiResponse<List<WorkspaceInviteResponse>> response = new ApiResponse<>(
                "200",
                "Get workspace invites successfully",
                workspaceInviteService.getWorkspaceInvites(workspaceId),
                null
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/invites/accept")
    public ResponseEntity<ApiResponse<WorkspaceInviteResponse>> acceptInvite(
            @Valid @RequestBody TokenRequest request) {

        ApiResponse<WorkspaceInviteResponse> response = new ApiResponse<>(
                "200",
                "Accept workspace invite successfully",
                workspaceInviteService.acceptInvite(request.getToken()),
                null
        );

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
                null
        );

        return ResponseEntity.ok(response);
    }
}
