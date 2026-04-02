package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import dev.alro127.tasksense.dto.request.UpdateWorkflowDraftRequest;
import dev.alro127.tasksense.dto.response.WorkflowDraftResponse;
import dev.alro127.tasksense.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/workflows")
public class WorkflowController {

    private final WorkflowService workflowService;

    @PutMapping("/{workflowId}")
    public ResponseEntity<ApiResponse<WorkflowDraftResponse>> updateWorkflowDraft(
            @PathVariable Long workflowId,
            @Valid @RequestBody UpdateWorkflowDraftRequest request) {

        ApiResponse<WorkflowDraftResponse> response = new ApiResponse<>(
                "200",
                "Update workflow draft successfully",
                workflowService.updateWorkflowDraft(workflowId, request),
                null);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{workflowId}/publish")
    public ResponseEntity<ApiResponse<WorkflowDraftResponse>> publishWorkflow(@PathVariable Long workflowId) {
        ApiResponse<WorkflowDraftResponse> response = new ApiResponse<>(
                "200",
                "Publish workflow successfully",
                workflowService.publishWorkflow(workflowId),
                null);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<WorkflowDraftResponse>>> getMyWorkflows(
            @RequestParam(required = false) WorkflowStatus status,
            Pageable pageable) {
        ApiResponse<PageResponse<WorkflowDraftResponse>> response = new ApiResponse<>(
                "200",
                "Get my workflows successfully",
                workflowService.getMyWorkflows(status, pageable),
                null);

        return ResponseEntity.ok(response);
    }
}
