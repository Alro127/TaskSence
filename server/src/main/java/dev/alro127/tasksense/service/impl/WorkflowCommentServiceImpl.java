package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkflowCommentEntity;
import dev.alro127.tasksense.domain.entity.WorkflowCommentMentionEntity;
import dev.alro127.tasksense.domain.entity.WorkflowCommentReactionEntity;
import dev.alro127.tasksense.domain.entity.WorkflowEntity;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import dev.alro127.tasksense.dto.request.CommentReactionRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowCommentRequest;
import dev.alro127.tasksense.dto.request.WorkflowCommentCreateRequest;
import dev.alro127.tasksense.dto.response.UserSummaryResponse;
import dev.alro127.tasksense.dto.response.WorkflowCommentResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowCommentMentionRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowCommentReactionRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowCommentRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowRepository;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkflowCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowCommentServiceImpl implements WorkflowCommentService {

        private final WorkflowCommentRepository workflowCommentRepository;
        private final WorkflowCommentReactionRepository reactionRepository;
        private final WorkflowCommentMentionRepository mentionRepository;
        private final WorkflowRepository workflowRepository;
        private final SecurityService securityService;
        private final UserRepository userRepository;
        private final NotificationService notificationService;

        private WorkflowEntity getPublicWorkflowOrThrow(Long workflowId) {
                return workflowRepository.findByIdAndStatus(workflowId, WorkflowStatus.PUBLIC)
                                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));
        }

        private WorkflowCommentEntity getPublicCommentOrThrow(Long commentId) {
                WorkflowCommentEntity comment = workflowCommentRepository.findById(commentId)
                                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

                if (comment.getWorkflow().getStatus() != WorkflowStatus.PUBLIC) {
                        throw new ResourceNotFoundException("Comment not found");
                }

                return comment;
        }

        private void checkOwner(WorkflowCommentEntity comment) {
                UserEntity currentUser = securityService.getCurrentUser();

                if (!comment.getUser().getId().equals(currentUser.getId())) {
                        throw new ForbiddenException("You are not allowed to take this action");
                }
        }

        private void saveMentions(WorkflowCommentEntity comment, Set<Long> userIds) {
                if (userIds == null || userIds.isEmpty())
                        return;

                List<UserEntity> users = userRepository.findAllById(userIds);

                List<WorkflowCommentMentionEntity> mentions = users.stream()
                                .map(user -> WorkflowCommentMentionEntity.builder()
                                                .comment(comment)
                                                .user(user)
                                                .build())
                                .toList();

                mentionRepository.saveAll(mentions);

                UserEntity currentUser = securityService.getCurrentUser();
                for (UserEntity user : users) {
                        if (user.getId().equals(currentUser.getId()))
                                continue;

                        notificationService.saveAndPublish(dev.alro127.tasksense.dto.message.NotificationMessage.builder()
                                        .receiverId(user.getId())
                                        .actorId(currentUser.getId())
                                        .type(dev.alro127.tasksense.domain.enums.NotificationType.WORKFLOW_COMMENT_MENTION)
                                        .referenceType(dev.alro127.tasksense.domain.enums.EntityType.WORKFLOW)
                                        .referenceId(comment.getWorkflow().getId())
                                        .payload(Map.of(
                                                        "workflowName", comment.getWorkflow().getName(),
                                                        "commentId", comment.getId()))
                                        .build());
                }
        }

        @Override
        @Transactional
        public WorkflowCommentResponse createComment(WorkflowCommentCreateRequest request) {
                UserEntity currentUser = securityService.getCurrentUser();
                WorkflowEntity workflow = getPublicWorkflowOrThrow(request.getWorkflowId());

                WorkflowCommentEntity parent = null;
                if (request.getParentCommentId() != null) {
                        parent = workflowCommentRepository.findById(request.getParentCommentId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));

                        if (!parent.getWorkflow().getId().equals(workflow.getId())) {
                                throw new BadRequestException("Parent comment must belong to the same workflow");
                        }

                        if (parent.getWorkflow().getStatus() != WorkflowStatus.PUBLIC) {
                                throw new ResourceNotFoundException("Parent comment not found");
                        }
                }

                WorkflowCommentEntity comment = WorkflowCommentEntity.builder()
                                .workflow(workflow)
                                .user(currentUser)
                                .parentComment(parent)
                                .content(request.getContent())
                                .isEdited(false)
                                .build();

                workflowCommentRepository.save(comment);

                Set<Long> mentionIds = Optional.ofNullable(request.getMentionUserIds())
                                .orElse(Collections.emptySet());
                saveMentions(comment, mentionIds);

                // Notify workflow owner
                if (!workflow.getCreatedBy().getId().equals(currentUser.getId())) {
                        notificationService.saveAndPublish(dev.alro127.tasksense.dto.message.NotificationMessage.builder()
                                        .receiverId(workflow.getCreatedBy().getId())
                                        .actorId(currentUser.getId())
                                        .type(dev.alro127.tasksense.domain.enums.NotificationType.WORKFLOW_COMMENT)
                                        .referenceType(dev.alro127.tasksense.domain.enums.EntityType.WORKFLOW)
                                        .referenceId(workflow.getId())
                                        .payload(Map.of(
                                                        "workflowName", workflow.getName(),
                                                        "commentId", comment.getId()))
                                        .build());
                }

                // Notify parent comment owner if it's a reply
                if (parent != null && !parent.getUser().getId().equals(currentUser.getId())
                                && !parent.getUser().getId().equals(workflow.getCreatedBy().getId())) {
                        notificationService.saveAndPublish(dev.alro127.tasksense.dto.message.NotificationMessage.builder()
                                        .receiverId(parent.getUser().getId())
                                        .actorId(currentUser.getId())
                                        .type(dev.alro127.tasksense.domain.enums.NotificationType.WORKFLOW_COMMENT)
                                        .referenceType(dev.alro127.tasksense.domain.enums.EntityType.WORKFLOW)
                                        .referenceId(workflow.getId())
                                        .payload(Map.of(
                                                        "workflowName", workflow.getName(),
                                                        "commentId", comment.getId(),
                                                        "isReply", true))
                                        .build());
                }

                return WorkflowCommentResponse.mapToResponse(comment);
        }

        @Override
        @Transactional
        public WorkflowCommentResponse updateComment(Long commentId, UpdateWorkflowCommentRequest request) {
                WorkflowCommentEntity comment = getPublicCommentOrThrow(commentId);
                checkOwner(comment);

                Set<Long> oldMentions = mentionRepository.findUserIdsByCommentId(commentId);
                Set<Long> newMentions = Optional.ofNullable(request.getMentionUserIds())
                                .orElse(Collections.emptySet());

                comment.setContent(request.getContent());
                comment.setIsEdited(true);

                mentionRepository.deleteByCommentId(commentId);
                saveMentions(comment, newMentions);

                Set<Long> addedMentions = new HashSet<>(newMentions);
                addedMentions.removeAll(oldMentions);

                return WorkflowCommentResponse.mapToResponse(comment);
        }

        @Override
        @Transactional
        public void deleteComment(Long commentId) {
                WorkflowCommentEntity comment = getPublicCommentOrThrow(commentId);
                checkOwner(comment);
                comment.setDeletedAt(OffsetDateTime.now());
        }

        @Override
        public List<WorkflowCommentResponse> getComments(Long workflowId, Long cursor, int limit, String sort) {
                getPublicWorkflowOrThrow(workflowId);

                String sortDir = sort != null && sort.equalsIgnoreCase("asc") ? "asc" : "desc";
                PageRequest pageable = PageRequest.of(0, limit);
                List<WorkflowCommentEntity> comments = workflowCommentRepository.findTopLevelComments(workflowId,
                                cursor, sortDir, pageable);

                if (comments.isEmpty()) {
                        return List.of();
                }

                List<Long> commentIds = comments.stream()
                                .map(WorkflowCommentEntity::getId)
                                .toList();

                Map<Long, List<WorkflowCommentReactionEntity>> reactionMap = reactionRepository
                                .findByCommentIdIn(commentIds)
                                .stream()
                                .collect(Collectors.groupingBy(r -> r.getComment().getId()));

                Map<Long, List<WorkflowCommentMentionEntity>> mentionMap = mentionRepository
                                .findByCommentIdIn(commentIds)
                                .stream()
                                .collect(Collectors.groupingBy(m -> m.getComment().getId()));

                Map<Long, Long> replyCountMap = workflowCommentRepository.countRepliesByParentIds(commentIds)
                                .stream()
                                .collect(Collectors.toMap(
                                                row -> (Long) row[0],
                                                row -> (Long) row[1]));

                return comments.stream()
                                .map(comment -> WorkflowCommentResponse.mapToResponse(
                                                comment,
                                                reactionMap.getOrDefault(comment.getId(), List.of()),
                                                mentionMap.getOrDefault(comment.getId(), List.of()),
                                                replyCountMap.getOrDefault(comment.getId(), 0L)))
                                .toList();
        }

        @Override
        public List<WorkflowCommentResponse> getReplies(Long parentId, Long cursor, int limit) {
                WorkflowCommentEntity parent = getPublicCommentOrThrow(parentId);

                PageRequest pageable = PageRequest.of(0, limit);
                List<WorkflowCommentEntity> replies = workflowCommentRepository.findReplies(parentId, cursor, pageable);

                if (replies.isEmpty()) {
                        return List.of();
                }

                List<Long> replyIds = replies.stream()
                                .map(WorkflowCommentEntity::getId)
                                .toList();

                Map<Long, List<WorkflowCommentReactionEntity>> reactionMap = reactionRepository
                                .findByCommentIdIn(replyIds)
                                .stream()
                                .collect(Collectors.groupingBy(r -> r.getComment().getId()));

                Map<Long, List<WorkflowCommentMentionEntity>> mentionMap = mentionRepository.findByCommentIdIn(replyIds)
                                .stream()
                                .collect(Collectors.groupingBy(m -> m.getComment().getId()));

                return replies.stream()
                                .map(reply -> WorkflowCommentResponse.mapToResponse(
                                                reply,
                                                reactionMap.getOrDefault(reply.getId(), List.of()),
                                                mentionMap.getOrDefault(reply.getId(), List.of()),
                                                0L // Replies typically don't show reply counts for deep nesting in this
                                                   // UI
                                ))
                                .toList();
        }

        @Override
        @Transactional
        public void addReaction(Long commentId, CommentReactionRequest request) {
                UserEntity currentUser = securityService.getCurrentUser();
                WorkflowCommentEntity comment = getPublicCommentOrThrow(commentId);

                Optional<WorkflowCommentReactionEntity> existingOpt = reactionRepository
                                .findByCommentIdAndUserId(commentId, currentUser.getId());

                if (existingOpt.isPresent()) {
                        WorkflowCommentReactionEntity existing = existingOpt.get();
                        if (existing.getIcon().equals(request.getIcon())) {
                                return;
                        }
                        existing.setIcon(request.getIcon());
                        reactionRepository.save(existing);
                        return;
                }

                WorkflowCommentReactionEntity reaction = reactionRepository.save(WorkflowCommentReactionEntity.builder()
                                .comment(comment)
                                .user(currentUser)
                                .icon(request.getIcon())
                                .build());

                // Notify comment owner
                if (!comment.getUser().getId().equals(currentUser.getId())) {
                        notificationService.saveAndPublish(dev.alro127.tasksense.dto.message.NotificationMessage.builder()
                                        .receiverId(comment.getUser().getId())
                                        .actorId(currentUser.getId())
                                        .type(dev.alro127.tasksense.domain.enums.NotificationType.WORKFLOW_COMMENT_REACTION)
                                        .referenceType(dev.alro127.tasksense.domain.enums.EntityType.WORKFLOW)
                                        .referenceId(comment.getWorkflow().getId())
                                        .payload(Map.of(
                                                        "workflowName", comment.getWorkflow().getName(),
                                                        "commentId", comment.getId(),
                                                        "icon", request.getIcon()))
                                        .build());
                }
        }

        @Override
        @Transactional
        public void updateReaction(Long commentId, CommentReactionRequest request) {
                UserEntity currentUser = securityService.getCurrentUser();
                WorkflowCommentEntity comment = getPublicCommentOrThrow(commentId);

                WorkflowCommentReactionEntity reaction = reactionRepository
                                .findByCommentIdAndUserId(commentId, currentUser.getId())
                                .orElse(WorkflowCommentReactionEntity.builder()
                                                .comment(comment)
                                                .user(currentUser)
                                                .build());

                reaction.setIcon(request.getIcon());
                reactionRepository.save(reaction);
        }

        @Override
        @Transactional
        public void removeReaction(Long commentId, CommentReactionRequest request) {
                Long currentUserId = securityService.getCurrentUserId();
                getPublicCommentOrThrow(commentId);

                reactionRepository.deleteByCommentIdAndUserIdAndIcon(commentId, currentUserId, request.getIcon());
        }

        @Override
        public List<UserSummaryResponse> getReactions(Long commentId, String icon) {
                getPublicCommentOrThrow(commentId);
                return reactionRepository.findUsersByCommentIdAndIcon(commentId, icon)
                                .stream()
                                .map(UserSummaryResponse::mapToResponse)
                                .toList();
        }
}
