package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import dev.alro127.tasksense.domain.entity.SprintEntity;
import dev.alro127.tasksense.domain.enums.SprintStatus;

@Data
@Builder
public class SprintResponse {

    private Long id;

    private Long projectId;

    private String name;

    private String goal;

    private Long taskCount;

    private Long completedTaskCount;

    private SprintStatus status;

    private LocalDate startDate;

    private LocalDate endDate;

    private Long createdBy;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static SprintResponse mapToResponse(
            SprintEntity sprint,
            Long taskCount,
            Long completedTaskCount) {
        return SprintResponse.builder()
                .id(sprint.getId())
                .projectId(sprint.getProject().getId())
                .name(sprint.getName())
                .goal(sprint.getGoal())
                .taskCount(taskCount)
                .completedTaskCount(completedTaskCount)
                .status(sprint.getStatus())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .createdBy(sprint.getCreatedBy().getId())
                .createdAt(sprint.getCreatedAt())
                .updatedAt(sprint.getUpdatedAt())
                .build();
    }
}