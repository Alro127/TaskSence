package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.CommentReactionRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowCommentRequest;
import dev.alro127.tasksense.dto.request.WorkflowCommentCreateRequest;
import dev.alro127.tasksense.dto.response.UserSummaryResponse;
import dev.alro127.tasksense.dto.response.WorkflowCommentResponse;
import dev.alro127.tasksense.service.WorkflowCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/workflow-comments")
@RequiredArgsConstructor
public class WorkflowCommentController {

    private final WorkflowCommentService workflowCommentService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WorkflowCommentResponse>> createComment(
            @Valid @RequestBody WorkflowCommentCreateRequest request) {

        ApiResponse<WorkflowCommentResponse> response = new ApiResponse<>(
                "200",
                "Create workflow comment successfully",
                workflowCommentService.createComment(request),
                null
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<WorkflowCommentResponse>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateWorkflowCommentRequest request) {

        ApiResponse<WorkflowCommentResponse> response = new ApiResponse<>(
                "200",
                "Update workflow comment successfully",
                workflowCommentService.updateComment(commentId, request),
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        workflowCommentService.deleteComment(commentId);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete workflow comment successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/workflow/{workflowId}")
    public ResponseEntity<ApiResponse<List<WorkflowCommentResponse>>> getCommentsByWorkflow(
            @PathVariable Long workflowId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit) {

        ApiResponse<List<WorkflowCommentResponse>> response = new ApiResponse<>(
                "200",
                "Get workflow comments successfully",
                workflowCommentService.getComments(workflowId, cursor, limit),
                null
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{commentId}/reactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> addReaction(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentReactionRequest request) {

        workflowCommentService.addReaction(commentId, request);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Add reaction successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{commentId}/reactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> updateReaction(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentReactionRequest request) {

        workflowCommentService.updateReaction(commentId, request);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Update reaction successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{commentId}/reactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable Long commentId,
            @RequestBody CommentReactionRequest request) {

        workflowCommentService.removeReaction(commentId, request);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Remove reaction successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{commentId}/reactions/{icon}")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getReactions(
            @PathVariable Long commentId,
            @PathVariable String icon) {

        ApiResponse<List<UserSummaryResponse>> response = new ApiResponse<>(
                "200",
                "Get reactions successfully",
                workflowCommentService.getReactions(commentId, icon),
                null
        );

        return ResponseEntity.ok(response);
    }
}
