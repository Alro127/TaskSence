package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.dto.request.CommentCreateRequest;
import dev.alro127.tasksense.dto.request.CommentReactionRequest;
import dev.alro127.tasksense.dto.request.UpdateCommentRequest;
import dev.alro127.tasksense.dto.response.CommentResponse;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.repository.jpa.*;
import dev.alro127.tasksense.service.CommentService;
import dev.alro127.tasksense.service.SecurityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository reactionRepository;
    private final CommentMentionRepository mentionRepository;
    private final TaskRepository taskRepository;
    private final SecurityService securityService;

    private void checkOwner(CommentEntity comment) {

        UserEntity currentUser = securityService.getCurrentUser();

        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You are not allowed to take this action");
        }
    }

    @Override
    public CommentResponse createComment(CommentCreateRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        TaskEntity task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new EntityNotFoundException("Task not found"));

        CommentEntity parent = null;
        if (request.getParentCommentId() != null) {
            parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent comment not found"));
        }

        CommentEntity comment = CommentEntity.builder()
                .task(task)
                .user(currentUser)
                .parentComment(parent)
                .content(request.getContent())
                .isEdited(false)
                .build();

        commentRepository.save(comment);

        return CommentResponse.mapToResponse(comment);
    }

    @Override
    public CommentResponse updateComment(Long commentId, UpdateCommentRequest request) {

        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        checkOwner(comment);

        comment.setContent(request.getContent());
        comment.setIsEdited(true);

        commentRepository.save(comment);

        return CommentResponse.mapToResponse(comment);
    }

    @Override
    public void deleteComment(Long commentId) {

        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        checkOwner(comment);

        comment.setDeletedAt(OffsetDateTime.now());

        commentRepository.save(comment);
    }

    @Override
    public List<CommentResponse> getComments(Long taskId, Long cursor, int limit) {

        PageRequest pageable = PageRequest.of(0, limit);

        List<CommentEntity> comments =
                commentRepository.findComments(taskId, cursor, pageable);

        if (comments.isEmpty()) {
            return List.of();
        }

        List<Long> commentIds = comments.stream()
                .map(CommentEntity::getId)
                .toList();

        List<CommentReactionEntity> reactions =
                reactionRepository.findByCommentIdIn(commentIds);

        List<CommentMentionEntity> mentions =
                mentionRepository.findByCommentIdIn(commentIds);

        Map<Long, List<CommentReactionEntity>> reactionMap =
                reactions.stream().collect(Collectors.groupingBy(r -> r.getComment().getId()));

        Map<Long, List<CommentMentionEntity>> mentionMap =
                mentions.stream().collect(Collectors.groupingBy(m -> m.getComment().getId()));

        return comments.stream()
                .map(comment -> CommentResponse.mapToResponse(
                        comment,
                        reactionMap.getOrDefault(comment.getId(), List.of()),
                        mentionMap.getOrDefault(comment.getId(), List.of())
                ))
                .toList();
    }

    @Override
    public void addReaction(Long commentId, CommentReactionRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        boolean exists = reactionRepository
                .findByCommentIdAndUserIdAndIcon(commentId, currentUser.getId(), request.getIcon())
                .isPresent();

        if (exists) return;

        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));

        CommentReactionEntity reaction = CommentReactionEntity.builder()
                .comment(comment)
                .user(currentUser)
                .icon(request.getIcon())
                .build();

        reactionRepository.save(reaction);
    }

    @Override
    public void removeReaction(Long commentId, CommentReactionRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        reactionRepository.deleteByCommentIdAndUserIdAndIcon(
                commentId,
                currentUser.getId(),
                request.getIcon()
        );
    }
}