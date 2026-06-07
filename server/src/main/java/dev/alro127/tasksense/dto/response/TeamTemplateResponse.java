package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

import dev.alro127.tasksense.domain.entity.TeamTemplateEntity;

@Getter
@Builder
public class TeamTemplateResponse {

    private Long id;

    private Long ownerId;

    private String name;

    private String description;

    private Long memberCount;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static TeamTemplateResponse mapToResponse(TeamTemplateEntity entity, Long memberCount) {
        return TeamTemplateResponse.builder()
                .id(entity.getId())
                .ownerId(entity.getOwner().getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .memberCount(memberCount)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}