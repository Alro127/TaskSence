package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class WorkspaceResponse {

    private Long id;

    private String name;

    private String description;

    private Long ownerId;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;
}
