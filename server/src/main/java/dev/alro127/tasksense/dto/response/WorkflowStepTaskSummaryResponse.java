package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkflowStepTaskSummaryResponse {

    private Long id;

    private String title;

    private TaskStatus status;

    private Long sprintId;

    private Long parentTaskId;
}
