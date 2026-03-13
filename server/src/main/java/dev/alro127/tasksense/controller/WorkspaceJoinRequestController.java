package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.response.WorkspaceJoinRequestResponse;
import dev.alro127.tasksense.service.WorkspaceJoinRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/workspace-join-requests")
@RequiredArgsConstructor
public class WorkspaceJoinRequestController {

        private final WorkspaceJoinRequestService joinRequestService;

        @PostMapping("/workspaces/{workspaceId}")
        public ResponseEntity<ApiResponse<WorkspaceJoinRequestResponse>> createJoinRequest(
                        @PathVariable Long workspaceId,
                        @Valid @RequestBody CreateWorkspaceJoinRequest request) {

                ApiResponse<WorkspaceJoinRequestResponse> response = new ApiResponse<>(
                                "201",
                                "Create workspace join request successfully",
                                joinRequestService.createJoinRequest(workspaceId, request),
                                null);

                return ResponseEntity.status(201).body(response);
        }

        @GetMapping("/workspaces/{workspaceId}")
        public ResponseEntity<ApiResponse<PageResponse<WorkspaceJoinRequestResponse>>> getWorkspaceJoinRequests(
                        @PathVariable Long workspaceId,
                        Pageable pageable) {

                ApiResponse<PageResponse<WorkspaceJoinRequestResponse>> response = new ApiResponse<>(
                                "200",
                                "Get workspace join requests successfully",
                                joinRequestService.getWorkspaceJoinRequests(workspaceId, pageable),
                                null);

                return ResponseEntity.ok(response);
        }

        @PatchMapping("/{requestId}/review")
        public ResponseEntity<ApiResponse<WorkspaceJoinRequestResponse>> reviewJoinRequest(
                        @PathVariable Long requestId,
                        @Valid @RequestBody ReviewWorkspaceJoinRequest request) {

                ApiResponse<WorkspaceJoinRequestResponse> response = new ApiResponse<>(
                                "200",
                                "Review workspace join request successfully",
                                joinRequestService.reviewJoinRequest(requestId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @PatchMapping("/{requestId}/cancel")
        public ResponseEntity<ApiResponse<WorkspaceJoinRequestResponse>> cancelJoinRequest(
                        @PathVariable Long requestId) {

                ApiResponse<WorkspaceJoinRequestResponse> response = new ApiResponse<>(
                                "200",
                                "Cancel workspace join request successfully",
                                joinRequestService.cancelJoinRequest(requestId),
                                null);

                return ResponseEntity.ok(response);
        }
}