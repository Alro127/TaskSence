package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class TeamMemberTemplateResponse {

    private Long id;

    private Long teamTemplateId;

    private Long userId;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;
}