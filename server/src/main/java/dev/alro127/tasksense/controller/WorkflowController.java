package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import dev.alro127.tasksense.dto.request.UpsertWorkflowRatingRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowDraftRequest;
import dev.alro127.tasksense.dto.response.WorkflowDraftResponse;
import dev.alro127.tasksense.dto.response.WorkflowFavoriteToggleResponse;
import dev.alro127.tasksense.dto.response.WorkflowRatingResponse;
import dev.alro127.tasksense.dto.response.WorkflowRatingSummaryResponse;
import dev.alro127.tasksense.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
        @PreAuthorize("@perm.workflowOwner(#workflowId)")
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

        @DeleteMapping("/{workflowId}")
        @PreAuthorize("@perm.workflowOwner(#workflowId)")
        public ResponseEntity<ApiResponse<Void>> deleteWorkflowDraft(@PathVariable Long workflowId) {
                workflowService.deleteWorkflowDraft(workflowId);
                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Delete workflow draft successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }

        @PostMapping("/{workflowId}/publish")
        @PreAuthorize("@perm.workflowOwner(#workflowId)")
        public ResponseEntity<ApiResponse<WorkflowDraftResponse>> publishWorkflow(@PathVariable Long workflowId) {
                ApiResponse<WorkflowDraftResponse> response = new ApiResponse<>(
                                "200",
                                "Publish workflow successfully",
                                workflowService.publishWorkflow(workflowId),
                                null);

                return ResponseEntity.ok(response);
        }

        @PostMapping("/{workflowId}/unpublish")
        @PreAuthorize("@perm.workflowOwner(#workflowId)")
        public ResponseEntity<ApiResponse<WorkflowDraftResponse>> unpublishWorkflow(@PathVariable Long workflowId) {
                ApiResponse<WorkflowDraftResponse> response = new ApiResponse<>(
                                "200",
                                "Unpublish workflow successfully",
                                workflowService.unpublishWorkflow(workflowId),
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

        @GetMapping("/me/favorites")
        public ResponseEntity<ApiResponse<PageResponse<WorkflowDraftResponse>>> getMyFavoriteWorkflows(
                        Pageable pageable) {
                ApiResponse<PageResponse<WorkflowDraftResponse>> response = new ApiResponse<>(
                                "200",
                                "Get my favorite workflows successfully",
                                workflowService.getMyFavoriteWorkflows(pageable),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/explore")
        public ResponseEntity<ApiResponse<PageResponse<WorkflowDraftResponse>>> explorePublicWorkflows(
                        @RequestParam(required = false) String keyword,
                        Pageable pageable) {
                ApiResponse<PageResponse<WorkflowDraftResponse>> response = new ApiResponse<>(
                                "200",
                                "Explore public workflows successfully",
                                workflowService.explorePublicWorkflows(keyword, pageable),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{workflowId}")
        public ResponseEntity<ApiResponse<WorkflowDraftResponse>> getWorkflowDetail(@PathVariable Long workflowId) {
                ApiResponse<WorkflowDraftResponse> response = new ApiResponse<>(
                                "200",
                                "Get workflow detail successfully",
                                workflowService.getWorkflowDetail(workflowId),
                                null);

                return ResponseEntity.ok(response);
        }

        @PutMapping("/{workflowId}/rating")
        public ResponseEntity<ApiResponse<WorkflowRatingResponse>> upsertWorkflowRating(
                        @PathVariable Long workflowId,
                        @Valid @RequestBody UpsertWorkflowRatingRequest request) {

                ApiResponse<WorkflowRatingResponse> response = new ApiResponse<>(
                                "200",
                                "Upsert workflow rating successfully",
                                workflowService.upsertWorkflowRating(workflowId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{workflowId}/rating-summary")
        public ResponseEntity<ApiResponse<WorkflowRatingSummaryResponse>> getWorkflowRatingSummary(
                        @PathVariable Long workflowId) {
                ApiResponse<WorkflowRatingSummaryResponse> response = new ApiResponse<>(
                                "200",
                                "Get workflow rating summary successfully",
                                workflowService.getWorkflowRatingSummary(workflowId),
                                null);

                return ResponseEntity.ok(response);
        }

        @PostMapping("/{workflowId}/favorite/toggle")
        public ResponseEntity<ApiResponse<WorkflowFavoriteToggleResponse>> toggleWorkflowFavorite(
                        @PathVariable Long workflowId) {
                ApiResponse<WorkflowFavoriteToggleResponse> response = new ApiResponse<>(
                                "200",
                                "Toggle workflow favorite successfully",
                                workflowService.toggleWorkflowFavorite(workflowId),
                                null);

                return ResponseEntity.ok(response);
        }
}
