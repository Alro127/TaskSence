package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;

@Data
@Builder
public class TaskResponse {

        private Long id;

        private Long projectId;

        private Long parentTaskId;

        private String title;

        private String description;

        private TaskPriority priority;

        private TaskStatus status;

        private OffsetDateTime startDate;

        private OffsetDateTime dueDate;

        private OffsetDateTime completedAt;

        private Integer position;

        private UserSummaryResponse createdBy;

        private List<UserSummaryResponse> assignees;

        private List<TagResponse> tags;

        private Long sprintId;

        private OffsetDateTime createdAt;

        private OffsetDateTime updatedAt;

        private Set<String> permissions;

        public static TaskResponse mapToResponse(TaskEntity task) {
                return TaskResponse.builder()
                                .id(task.getId())
                                .projectId(task.getProject().getId())
                                .parentTaskId(task.getParentTask() != null ? task.getParentTask().getId() : null)
                                .title(task.getTitle())
                                .description(task.getDescription())
                                .priority(task.getPriority())
                                .status(task.getStatus())
                                .startDate(task.getStartDate())
                                .dueDate(task.getDueDate())
                                .completedAt(task.getCompletedAt())
                                .position(task.getPosition())
                                .createdBy(UserSummaryResponse.mapToResponse(task.getCreatedBy()))
                                .assignees(task.getAssignees().stream()
                                                .map(UserSummaryResponse::mapToResponse)
                                                .collect(Collectors.toList()))
                                .tags(task.getTags().stream()
                                                .map(TagResponse::mapToResponse)
                                                .collect(Collectors.toList()))
                                .sprintId(task.getSprint() != null ? task.getSprint().getId() : null)
                                .createdAt(task.getCreatedAt())
                                .updatedAt(task.getUpdatedAt())
                                .build();
        }
}
