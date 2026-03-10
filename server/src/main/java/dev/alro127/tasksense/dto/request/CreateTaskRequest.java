package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Task title must not exceed 255 characters")
    private String title;

    private String description;

    private TaskPriority priority;

    private OffsetDateTime startDate;

    private OffsetDateTime dueDate;

    private Long parentTaskId;

    private List<Long> assigneeIds;
}
