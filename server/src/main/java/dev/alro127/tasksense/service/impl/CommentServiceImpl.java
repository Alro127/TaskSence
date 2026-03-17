package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.CommentCreateRequest;
import dev.alro127.tasksense.dto.request.CommentReactionRequest;
import dev.alro127.tasksense.dto.request.UpdateCommentRequest;
import dev.alro127.tasksense.dto.response.CommentResponse;
import dev.alro127.tasksense.dto.response.UserSummaryResponse;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.*;
import dev.alro127.tasksense.event.EntityChangedEvent;
import dev.alro127.tasksense.event.EntityChangedEvent.Operation;
import dev.alro127.tasksense.service.CommentService;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.SecurityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final CommentReactionRepository reactionRepository;
    private final CommentMentionRepository mentionRepository;
    private final TaskRepository taskRepository;
    private final SecurityService securityService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    private void checkOwner(CommentEntity comment) {

        UserEntity currentUser = securityService.getCurrentUser();

        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You are not allowed to take this action");
        }
    }

    private void saveMentions(CommentEntity comment, Set<Long> userIds) {

        if (userIds == null || userIds.isEmpty()) return;

        List<UserEntity> users = userRepository.findAllById(userIds);

        List<CommentMentionEntity> mentions = users.stream()
                .map(user -> CommentMentionEntity.builder()
                        .comment(comment)
                        .user(user)
                        .build())
                .toList();

        mentionRepository.saveAll(mentions);
    }

    private void sendTaskCommentNotifications(CommentEntity comment,
                                              Set<Long> mentionIds,
                                              UserEntity currentUser) {

        TaskEntity task = comment.getTask();
        ProjectEntity project = task.getProject();
        WorkspaceEntity workspace = project.getWorkspace();

        Map<Long, NotificationType> recipients = new HashMap<>();

        for (UserEntity assignee : task.getAssignees()) {
            recipients.put(assignee.getId(), NotificationType.COMMENT_TASK);
        }

        for (Long mentionId : mentionIds) {
            recipients.put(mentionId, NotificationType.COMMENT_MENTION);
        }

        recipients.remove(currentUser.getId());

        for (var entry : recipients.entrySet()) {

            notificationService.saveAndPublish(
                    NotificationMessage.builder()
                            .actorId(currentUser.getId())
                            .receiverId(entry.getKey())
                            .type(entry.getValue())
                            .referenceType(EntityType.COMMENT)
                            .referenceId(comment.getId())
                            .payload(Map.of(
                                    "referenceName", task.getTitle(),
                                    "sender", currentUser.getFullName(),
                                    "taskId", task.getId(),
                                    "projectId", project.getId(),
                                    "workspaceId", workspace.getId()
                            ))
                            .build()
            );
        }
    }

    @Override
    @Transactional
    public CommentResponse createComment(CommentCreateRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        TaskEntity task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        CommentEntity parent = null;
        if (request.getParentCommentId() != null) {
            parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
        }

        CommentEntity comment = CommentEntity.builder()
                .task(task)
                .user(currentUser)
                .parentComment(parent)
                .content(request.getContent())
                .isEdited(false)
                .build();

        commentRepository.save(comment);

        Set<Long> mentionIds = Optional.ofNullable(request.getMentionUserIds())
                .orElse(Collections.emptySet());

        saveMentions(comment, mentionIds);

        sendTaskCommentNotifications(comment, mentionIds, currentUser);

        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.COMMENT, comment.getId(), Operation.UPSERT));
        return CommentResponse.mapToResponse(comment);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long commentId, UpdateCommentRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        checkOwner(comment);

        Set<Long> oldMentions = mentionRepository.findUserIdsByCommentId(commentId);

        Set<Long> newMentions = request.getMentionUserIds();

        comment.setContent(request.getContent());
        comment.setIsEdited(true);

        mentionRepository.deleteByCommentId(commentId);
        saveMentions(comment, newMentions);

        Set<Long> addedMentions = new HashSet<>(newMentions);
        addedMentions.removeAll(oldMentions);

        if (!addedMentions.isEmpty()) {
            sendTaskCommentNotifications(comment, addedMentions, currentUser);
        }

        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.COMMENT, commentId, Operation.UPSERT));
        return CommentResponse.mapToResponse(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {

        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        checkOwner(comment);

        comment.setDeletedAt(OffsetDateTime.now());
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.COMMENT, commentId, Operation.DELETE));
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

        Map<Long, List<CommentReactionEntity>> reactionMap =
                reactionRepository.findByCommentIdIn(commentIds)
                        .stream()
                        .collect(Collectors.groupingBy(r -> r.getComment().getId()));

        Map<Long, List<CommentMentionEntity>> mentionMap =
                mentionRepository.findByCommentIdIn(commentIds)
                        .stream()
                        .collect(Collectors.groupingBy(m -> m.getComment().getId()));

        return comments.stream()
                .map(comment -> CommentResponse.mapToResponse(
                        comment,
                        reactionMap.getOrDefault(comment.getId(), List.of()),
                        mentionMap.getOrDefault(comment.getId(), List.of())
                ))
                .toList();
    }

    @Override
    @Transactional
    public void addReaction(Long commentId, CommentReactionRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        boolean exists = reactionRepository
                .findByCommentIdAndUserIdAndIcon(commentId, currentUser.getId(), request.getIcon())
                .isPresent();

        if (exists) return;

        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        CommentReactionEntity reaction = CommentReactionEntity.builder()
                .comment(comment)
                .user(currentUser)
                .icon(request.getIcon())
                .build();

        TaskEntity task = comment.getTask();
        ProjectEntity project = task.getProject();
        WorkspaceEntity workspace = project.getWorkspace();
        UserEntity receiver = comment.getUser();

        if (!currentUser.getId().equals(receiver.getId())) {
            notificationService.saveAndPublish(NotificationMessage.builder()
                    .actorId(currentUser.getId())
                    .receiverId(receiver.getId())
                    .type(NotificationType.COMMENT_REACTION)
                    .referenceType(EntityType.COMMENT)
                    .referenceId(comment.getId())
                    .payload(Map.of("taskId", task.getId(),
                            "sender", currentUser.getFullName(),
                            "projectId", project.getId(),
                            "workspaceId", workspace.getId()))
                    .build());

        }

        reactionRepository.save(reaction);
    }

    @Transactional
    @Override
    public void updateReaction(Long commentId, CommentReactionRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        CommentEntity comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        CommentReactionEntity reaction = reactionRepository
                .findByCommentIdAndUserId(commentId, currentUser.getId()).orElse(
                        CommentReactionEntity.builder()
                        .comment(comment)
                        .user(currentUser)
                        .build());

        reaction.setIcon(request.getIcon());
        reactionRepository.save(reaction);
    }

    @Override
    @Transactional
    public void removeReaction(Long commentId, CommentReactionRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        reactionRepository.deleteByCommentIdAndUserIdAndIcon(
                commentId,
                currentUser.getId(),
                request.getIcon()
        );
    }

    @Override
    public List<UserSummaryResponse> getReactions(Long commentId, String icon) {
        List<UserEntity> users = reactionRepository.findUsersByCommentIdAndIcon(commentId, icon);

        return users.stream().map(UserSummaryResponse::mapToResponse).toList();
    }
}