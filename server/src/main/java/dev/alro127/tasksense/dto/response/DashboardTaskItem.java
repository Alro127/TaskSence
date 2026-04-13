package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class DashboardTaskItem {
    private Long id;
    private String title;
    private String projectName;
    private Long projectId;
    private Long workspaceId;
    private TaskStatus status;
    private TaskPriority priority;
    private OffsetDateTime dueDate;
}
