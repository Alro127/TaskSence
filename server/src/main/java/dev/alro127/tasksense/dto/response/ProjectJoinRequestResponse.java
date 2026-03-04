package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.ProjectJoinRequestEntity;
import dev.alro127.tasksense.domain.enums.JoinRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class ProjectJoinRequestResponse {

    private Long id;

    private Long projectId;

    private UserSummaryResponse user;

    private JoinRequestStatus status;

    private String message;

    private UserSummaryResponse reviewedBy;

    private OffsetDateTime reviewedAt;

    private OffsetDateTime createdAt;

    public static ProjectJoinRequestResponse mapToResponse(ProjectJoinRequestEntity request) {
        return ProjectJoinRequestResponse.builder()
                .id(request.getId())
                .projectId(request.getProject().getId())
                .user(UserSummaryResponse.mapToResponse(request.getUser()))
                .status(request.getStatus())
                .message(request.getMessage())
                .reviewedBy(UserSummaryResponse.mapToResponse(request.getReviewedBy()))
                .reviewedAt(request.getReviewedAt())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
