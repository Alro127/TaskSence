package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.TeamTemplateEntity;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class TeamTemplateResponse {

    private Long id;

    private Long ownerId;

    private String name;

    private String description;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static TeamTemplateResponse mapToResponse(TeamTemplateEntity entity) {
        return TeamTemplateResponse.builder()
                .id(entity.getId())
                .ownerId(entity.getOwner().getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}