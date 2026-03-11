package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CommentCreateRequest;
import dev.alro127.tasksense.dto.request.CommentReactionRequest;
import dev.alro127.tasksense.dto.request.UpdateCommentRequest;
import dev.alro127.tasksense.dto.response.CommentResponse;

import java.util.List;

public interface CommentService {

    CommentResponse createComment(CommentCreateRequest request);

    CommentResponse updateComment(Long commentId, UpdateCommentRequest request);

    void deleteComment(Long commentId);

    List<CommentResponse> getComments(Long taskId, Long cursor, int limit);

    void addReaction(Long commentId, CommentReactionRequest request);

    void removeReaction(Long commentId, CommentReactionRequest request);
}