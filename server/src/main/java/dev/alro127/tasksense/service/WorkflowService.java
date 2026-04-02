package dev.alro127.tasksense.service;

import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateWorkflowFromProjectRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowDraftRequest;
import dev.alro127.tasksense.dto.response.WorkflowDraftResponse;
import org.springframework.data.domain.Pageable;

public interface WorkflowService {

    WorkflowDraftResponse createWorkflowFromProject(Long projectId, CreateWorkflowFromProjectRequest request);

    WorkflowDraftResponse updateWorkflowDraft(Long workflowId, UpdateWorkflowDraftRequest request);

    WorkflowDraftResponse publishWorkflow(Long workflowId);

    PageResponse<WorkflowDraftResponse> getMyWorkflows(WorkflowStatus status, Pageable pageable);
}
