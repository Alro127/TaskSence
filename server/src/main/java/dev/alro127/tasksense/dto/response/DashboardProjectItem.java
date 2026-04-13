package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.enums.ProjectStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class DashboardProjectItem {
    private Long id;
    private Long workspaceId;
    private String name;
    private String workspaceName;
    private ProjectStatus status;
    private double progress;
    private long taskCount;
    private long overdueCount;
    private long memberCount;
    private LocalDate endDate;
}
