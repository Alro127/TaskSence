package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CommentReactionRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowCommentRequest;
import dev.alro127.tasksense.dto.request.WorkflowCommentCreateRequest;
import dev.alro127.tasksense.dto.response.UserSummaryResponse;
import dev.alro127.tasksense.dto.response.WorkflowCommentResponse;

import java.util.List;

public interface WorkflowCommentService {

    WorkflowCommentResponse createComment(WorkflowCommentCreateRequest request);

    WorkflowCommentResponse updateComment(Long commentId, UpdateWorkflowCommentRequest request);

    void deleteComment(Long commentId);

    List<WorkflowCommentResponse> getComments(Long workflowId, Long cursor, int limit);

    void addReaction(Long commentId, CommentReactionRequest request);

    void updateReaction(Long commentId, CommentReactionRequest request);

    void removeReaction(Long commentId, CommentReactionRequest request);

    List<UserSummaryResponse> getReactions(Long commentId, String icon);
}
