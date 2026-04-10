package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class DeadlineItem {
    private Long id;
    private String label;
    private String type;       // "TASK" | "SPRINT" | "PROJECT"
    private LocalDate date;
    private Long workspaceId;
    private Long projectId;    // null when type = PROJECT
}
