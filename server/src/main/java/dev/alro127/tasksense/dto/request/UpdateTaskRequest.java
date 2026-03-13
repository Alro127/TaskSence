package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class UpdateTaskRequest {

    @Size(max = 255, message = "Task title must not exceed 255 characters")
    private String title;

    private String description;

    private TaskPriority priority;

    private TaskStatus status;

    private OffsetDateTime startDate;

    private OffsetDateTime dueDate;

    private Integer position;

    private List<Long> assigneeIds;

    private Long parentTaskId;

    private Long sprintId;

    private boolean removeParent = false;

    private boolean removeSprint = false;
}
