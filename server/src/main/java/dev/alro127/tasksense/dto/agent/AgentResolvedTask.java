package dev.alro127.tasksense.dto.agent;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AgentResolvedTask {
    private Long taskId;
    private String taskTitle;
    private Long projectId;
    private String projectName;
    private Long workspaceId;
    private String workspaceName;
    private Set<String> permissions;
}
