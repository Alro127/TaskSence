package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.CommentCreateRequest;
import dev.alro127.tasksense.dto.request.CommentReactionRequest;
import dev.alro127.tasksense.dto.request.UpdateCommentRequest;
import dev.alro127.tasksense.dto.response.CommentResponse;
import dev.alro127.tasksense.dto.response.UserSummaryResponse;
import dev.alro127.tasksense.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody CommentCreateRequest request) {

        CommentResponse comment = commentService.createComment(request);

        ApiResponse<CommentResponse> response = new ApiResponse<>(
                "200",
                "Create comment successfully",
                comment,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request) {

        CommentResponse comment = commentService.updateComment(commentId, request);

        ApiResponse<CommentResponse> response = new ApiResponse<>(
                "200",
                "Update comment successfully",
                comment,
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getCommentsByTask(
            @PathVariable Long taskId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit) {

        List<CommentResponse> comments =
                commentService.getComments(taskId, cursor, limit);

        ApiResponse<List<CommentResponse>> response = new ApiResponse<>(
                "200",
                "Get comments successfully",
                comments,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{commentId}/reactions")
    public ResponseEntity<ApiResponse<Void>> addReaction(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentReactionRequest request) {

        commentService.addReaction(commentId, request);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Add reaction successfully",
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
                commentService.getReactions(commentId, icon),
                null
        );

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{commentId}/reactions")
    public ResponseEntity<ApiResponse<Void>> updateReaction(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentReactionRequest request) {

        commentService.updateReaction(commentId, request);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Update reaction successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{commentId}/reactions")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable Long commentId,
            @RequestBody CommentReactionRequest request) {

        commentService.removeReaction(commentId, request);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Remove reaction successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId) {

        commentService.deleteComment(commentId);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete comment successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }
}