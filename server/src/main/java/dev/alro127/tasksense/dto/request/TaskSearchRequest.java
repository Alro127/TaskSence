package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.TaskStatus;
import lombok.Data;

@Data
public class TaskSearchRequest {

    private TaskStatus status;

    private String keyword;

    private Long cursor;

    private int size = 20;
}
