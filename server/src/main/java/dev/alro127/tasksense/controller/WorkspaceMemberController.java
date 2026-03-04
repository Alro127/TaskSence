package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRoleRequest;
import dev.alro127.tasksense.dto.response.WorkspaceMemberResponse;
import dev.alro127.tasksense.service.WorkspaceMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceMemberController {

    private final WorkspaceMemberService workspaceMemberService;

    @GetMapping("/{workspaceId}/members")
    public ResponseEntity<ApiResponse<List<WorkspaceMemberResponse>>> getWorkspaceMembers(
            @PathVariable Long workspaceId) {

        ApiResponse<List<WorkspaceMemberResponse>> response = new ApiResponse<>(
                "200",
                "Get workspace members successfully",
                workspaceMemberService.getWorkspaceMembers(workspaceId),
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{workspaceId}/members/{memberId}")
    public ResponseEntity<ApiResponse<WorkspaceMemberResponse>> updateMemberRole(
            @PathVariable Long workspaceId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateWorkspaceRoleRequest request) {

        ApiResponse<WorkspaceMemberResponse> response = new ApiResponse<>(
                "200",
                "Update member role successfully",
                workspaceMemberService.updateMemberRole(workspaceId, memberId, request),
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{workspaceId}/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long workspaceId,
            @PathVariable Long memberId) {

        workspaceMemberService.removeMember(workspaceId, memberId);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Remove member successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }
}