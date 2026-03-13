package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.ProjectJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewProjectJoinRequest;
import dev.alro127.tasksense.dto.response.ProjectJoinRequestResponse;
import dev.alro127.tasksense.service.ProjectJoinRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/join-requests")
@RequiredArgsConstructor
public class ProjectJoinRequestController {

    private final ProjectJoinRequestService projectJoinRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectJoinRequestResponse>> sendJoinRequest(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectJoinRequest request) {

        ApiResponse<ProjectJoinRequestResponse> response = new ApiResponse<>(
                "201",
                "Join request sent successfully",
                projectJoinRequestService.sendJoinRequest(projectId, request),
                null);

        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProjectJoinRequestResponse>>> getJoinRequests(
            @PathVariable Long projectId,
            Pageable pageable) {

        ApiResponse<PageResponse<ProjectJoinRequestResponse>> response = new ApiResponse<>(
                "200",
                "Get join requests successfully",
                projectJoinRequestService.getJoinRequests(projectId, pageable),
                null);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{requestId}/review")
    public ResponseEntity<ApiResponse<ProjectJoinRequestResponse>> reviewJoinRequest(
            @PathVariable Long projectId,
            @PathVariable Long requestId,
            @Valid @RequestBody ReviewProjectJoinRequest request) {

        ApiResponse<ProjectJoinRequestResponse> response = new ApiResponse<>(
                "200",
                "Join request reviewed successfully",
                projectJoinRequestService.reviewJoinRequest(projectId, requestId, request),
                null);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<ApiResponse<Void>> cancelJoinRequest(
            @PathVariable Long projectId,
            @PathVariable Long requestId) {

        projectJoinRequestService.cancelJoinRequest(projectId, requestId);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Join request cancelled successfully",
                null,
                null);

        return ResponseEntity.ok(response);
    }
}
