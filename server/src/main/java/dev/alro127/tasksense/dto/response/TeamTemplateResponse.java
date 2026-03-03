package dev.alro127.tasksense.dto.response;

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
}