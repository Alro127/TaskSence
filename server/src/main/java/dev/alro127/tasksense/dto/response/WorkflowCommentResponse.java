package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.WorkflowCommentEntity;
import dev.alro127.tasksense.domain.entity.WorkflowCommentMentionEntity;
import dev.alro127.tasksense.domain.entity.WorkflowCommentReactionEntity;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
public class WorkflowCommentResponse {

    private Long id;

    private Long workflowId;

    private Long parentCommentId;

    private String content;

    private boolean isEdited;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    private UserResponse user;

    private List<UserResponse> mentions;

    private Map<String, Long> reactions;

    public static WorkflowCommentResponse mapToResponse(WorkflowCommentEntity comment) {
        return WorkflowCommentResponse.builder()
                .id(comment.getId())
                .workflowId(comment.getWorkflow().getId())
                .parentCommentId(
                        comment.getParentComment() != null
                                ? comment.getParentComment().getId()
                                : null
                )
                .content(comment.getContent())
                .isEdited(comment.getIsEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .user(UserResponse.mapToResponse(comment.getUser()))
                .mentions(List.of())
                .reactions(Map.of())
                .build();
    }

    public static WorkflowCommentResponse mapToResponse(
            WorkflowCommentEntity comment,
            List<WorkflowCommentReactionEntity> reactions,
            List<WorkflowCommentMentionEntity> mentions
    ) {

        Map<String, Long> reactionMap = reactions.stream()
                .collect(Collectors.groupingBy(
                        WorkflowCommentReactionEntity::getIcon,
                        Collectors.counting()
                ));

        List<UserResponse> mentionUsers = mentions.stream()
                .map(m -> UserResponse.mapToResponse(m.getUser()))
                .toList();

        return WorkflowCommentResponse.builder()
                .id(comment.getId())
                .workflowId(comment.getWorkflow().getId())
                .parentCommentId(
                        comment.getParentComment() != null
                                ? comment.getParentComment().getId()
                                : null
                )
                .content(comment.getContent())
                .isEdited(comment.getIsEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .user(UserResponse.mapToResponse(comment.getUser()))
                .mentions(mentionUsers)
                .reactions(reactionMap)
                .build();
    }
}
