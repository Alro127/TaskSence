package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.enums.ProjectStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;

@Data
@Builder
public class ProjectResponse {

    private Long id;

    private Long workspaceId;

    private String name;

    private String description;

    private ProjectStatus status;

    private Float progress;

    private Long taskCount;

    private LocalDate startDate;

    private LocalDate endDate;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    private Set<String> permissions;

    public static ProjectResponse mapToResponse(ProjectEntity project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .workspaceId(project.getWorkspace().getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
