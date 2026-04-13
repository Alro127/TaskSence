package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardSummaryResponse {
    private long totalTasks;
    private long completedTasks;
    private long overdueTasks;
    private long activeProjects;
}
