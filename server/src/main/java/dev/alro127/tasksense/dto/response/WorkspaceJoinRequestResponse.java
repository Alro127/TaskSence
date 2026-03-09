package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.WorkspaceJoinRequestEntity;
import dev.alro127.tasksense.domain.enums.JoinRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class WorkspaceJoinRequestResponse {

    private Long id;

    private Long workspaceId;

    private UserSummaryResponse user;

    private JoinRequestStatus status;

    private String message;

    private Long reviewedBy;

    private OffsetDateTime reviewedAt;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static WorkspaceJoinRequestResponse mapToResponse(WorkspaceJoinRequestEntity entity) {
        return WorkspaceJoinRequestResponse.builder()
                .id(entity.getId())
                .workspaceId(entity.getWorkspace().getId())
                .user(UserSummaryResponse.mapToResponse(entity.getUser()))
                .status(entity.getStatus())
                .message(entity.getMessage())
                .reviewedBy(entity.getReviewedBy() != null
                        ? entity.getReviewedBy().getId()
                        : null)
                .reviewedAt(entity.getReviewedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}