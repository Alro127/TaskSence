package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.guidance.WorkflowGuidanceDto;
import dev.alro127.tasksense.dto.request.CreateProjectFromWorkflowRequest;
import dev.alro127.tasksense.dto.request.GenerateGuidanceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowGuidanceRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.service.WorkflowGuidanceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping
public class WorkflowGuidanceController {

    private final WorkflowGuidanceService guidanceService;

    @PostMapping("/workflows/{workflowId}/guidance/generate")
    @PreAuthorize("@perm.workflowOwner(#workflowId)")
    public ResponseEntity<ApiResponse<WorkflowGuidanceDto>> generateGuidance(
            @PathVariable Long workflowId,
            @RequestBody(required = false) GenerateGuidanceRequest request,
            HttpServletRequest servletRequest) {

        String authToken = servletRequest.getHeader("Authorization");
        ApiResponse<WorkflowGuidanceDto> response = new ApiResponse<>(
                "200",
                "Generate guidance successfully",
                guidanceService.generateGuidance(workflowId, request, authToken),
                null);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/workflows/{workflowId}/guidance")
    @PreAuthorize("@perm.workflowOwner(#workflowId)")
    public ResponseEntity<ApiResponse<WorkflowGuidanceDto>> updateGuidance(
            @PathVariable Long workflowId,
            @Valid @RequestBody UpdateWorkflowGuidanceRequest request) {

        ApiResponse<WorkflowGuidanceDto> response = new ApiResponse<>(
                "200",
                "Update guidance successfully",
                guidanceService.updateGuidance(workflowId, request),
                null);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/{projectId}/guidance")
    @PreAuthorize("@perm.project(#projectId, 'VIEW')")
    public ResponseEntity<ApiResponse<WorkflowGuidanceDto>> getGuidanceByProject(
            @PathVariable Long projectId) {

        ApiResponse<WorkflowGuidanceDto> response = new ApiResponse<>(
                "200",
                "Get project guidance successfully",
                guidanceService.getGuidanceByProject(projectId),
                null);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/workflows/{workflowId}/guidance")
    public ResponseEntity<ApiResponse<WorkflowGuidanceDto>> getGuidanceByWorkflow(
            @PathVariable Long workflowId) {

        ApiResponse<WorkflowGuidanceDto> response = new ApiResponse<>(
                "200",
                "Get workflow guidance successfully",
                guidanceService.getGuidanceByWorkflow(workflowId),
                null);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/workflows/{workflowId}/projects")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProjectFromWorkflow(
            @PathVariable Long workflowId,
            @Valid @RequestBody CreateProjectFromWorkflowRequest request) {

        ApiResponse<ProjectResponse> response = new ApiResponse<>(
                "201",
                "Create project from workflow successfully",
                guidanceService.createProjectFromWorkflow(workflowId, request),
                null);

        return ResponseEntity.status(201).body(response);
    }
}
