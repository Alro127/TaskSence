package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Set;

import dev.alro127.tasksense.domain.entity.WorkspaceEntity;

@Data
@Builder
public class WorkspaceResponse {

    private Long id;

    private String name;

    private String description;

    private Long projectCount;

    private Long ownerId;

    private Boolean isPublic;

    private Set<String> permissions;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static WorkspaceResponse mapToResponse(WorkspaceEntity workspace) {
        return WorkspaceResponse.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .description(workspace.getDescription())
                .ownerId(workspace.getOwner().getId())
                .isPublic(workspace.getIsPublic())
                .createdAt(workspace.getCreatedAt())
                .updatedAt(workspace.getUpdatedAt())
                .build();
    }
}
