package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.TeamMemberTemplateEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class TeamMemberTemplateResponse {

    private Long id;

    private Long teamTemplateId;

    private UserSummaryResponse userSummaryResponse;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static TeamMemberTemplateResponse mapToResponse(TeamMemberTemplateEntity entity) {

        return TeamMemberTemplateResponse.builder()
                .id(entity.getId())
                .teamTemplateId(entity.getTeamTemplate().getId())
                .userSummaryResponse(UserSummaryResponse.mapToResponse(entity.getUser()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}