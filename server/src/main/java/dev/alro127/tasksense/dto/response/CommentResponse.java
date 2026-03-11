package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.CommentEntity;
import dev.alro127.tasksense.domain.entity.CommentMentionEntity;
import dev.alro127.tasksense.domain.entity.CommentReactionEntity;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
public class CommentResponse {

    private Long id;

    private Long taskId;

    private Long parentCommentId;

    private String content;

    private boolean isEdited;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    private UserResponse user;

    private List<UserResponse> mentions;

    private Map<String, Long> reactions;


    public static CommentResponse mapToResponse(CommentEntity comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTask().getId())
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


    public static CommentResponse mapToResponse(
            CommentEntity comment,
            List<CommentReactionEntity> reactions,
            List<CommentMentionEntity> mentions
    ) {

        Map<String, Long> reactionMap = reactions.stream()
                .collect(Collectors.groupingBy(
                        CommentReactionEntity::getIcon,
                        Collectors.counting()
                ));

        List<UserResponse> mentionUsers = mentions.stream()
                .map(m -> UserResponse.mapToResponse(m.getUser()))
                .toList();

        return CommentResponse.builder()
                .id(comment.getId())
                .taskId(comment.getTask().getId())
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