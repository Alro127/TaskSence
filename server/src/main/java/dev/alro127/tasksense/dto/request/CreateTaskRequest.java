package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;

@Data
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Task title must not exceed 255 characters")
    private String title;

    @Size(max = 2000, message = "Task description must not exceed 2000 characters")
    private String description;

    private TaskPriority priority;

    @FutureOrPresent(message = "Start date must be in the present or future")
    private OffsetDateTime startDate;

    @FutureOrPresent(message = "Due date must be in the present or future")
    private OffsetDateTime dueDate;

    private TaskStatus status;

    private Long parentTaskId;

    private Long sprintId;

    private List<Long> tagIds;

    private List<Long> assigneeIds;
}
