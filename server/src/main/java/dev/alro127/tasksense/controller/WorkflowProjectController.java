package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.CreateWorkflowFromProjectRequest;
import dev.alro127.tasksense.dto.response.WorkflowDraftResponse;
import dev.alro127.tasksense.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/projects/{projectId}/workflows")
public class WorkflowProjectController {

    private final WorkflowService workflowService;

    @PostMapping("/drafts/from-project")
    @PreAuthorize("@perm.project(#projectId, 'VIEW_TASKS')")
    public ResponseEntity<ApiResponse<WorkflowDraftResponse>> createWorkflowDraftFromProject(
            @PathVariable Long projectId,
            @Valid @RequestBody(required = false) CreateWorkflowFromProjectRequest request) {

        ApiResponse<WorkflowDraftResponse> response = new ApiResponse<>(
                "201",
                "Create workflow draft successfully",
                workflowService.createWorkflowFromProject(projectId, request),
                null);

        return ResponseEntity.status(201).body(response);
    }
}
