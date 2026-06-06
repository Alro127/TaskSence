package dev.alro127.tasksense.service;

import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateWorkflowFromProjectRequest;
import dev.alro127.tasksense.dto.request.UpsertWorkflowRatingRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowDraftRequest;
import dev.alro127.tasksense.dto.response.WorkflowDraftResponse;
import dev.alro127.tasksense.dto.response.WorkflowFavoriteToggleResponse;
import dev.alro127.tasksense.dto.response.WorkflowRatingResponse;
import dev.alro127.tasksense.dto.response.WorkflowRatingSummaryResponse;
import org.springframework.data.domain.Pageable;

public interface WorkflowService {

    WorkflowDraftResponse createWorkflowFromProject(Long projectId, CreateWorkflowFromProjectRequest request);

    WorkflowDraftResponse updateWorkflowDraft(Long workflowId, UpdateWorkflowDraftRequest request);

    WorkflowDraftResponse publishWorkflow(Long workflowId);

    WorkflowDraftResponse unpublishWorkflow(Long workflowId);

    PageResponse<WorkflowDraftResponse> getMyWorkflows(WorkflowStatus status, Pageable pageable);

    PageResponse<WorkflowDraftResponse> getMyFavoriteWorkflows(Pageable pageable);

    PageResponse<WorkflowDraftResponse> explorePublicWorkflows(String keyword, Pageable pageable);

    WorkflowDraftResponse getWorkflowDetail(Long workflowId);

    WorkflowRatingResponse upsertWorkflowRating(Long workflowId, UpsertWorkflowRatingRequest request);

    WorkflowRatingSummaryResponse getWorkflowRatingSummary(Long workflowId);

    WorkflowFavoriteToggleResponse toggleWorkflowFavorite(Long workflowId);

    void deleteWorkflowDraft(Long workflowId);
}
