package dev.alro127.tasksense.dto.agent;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AgentResolvedWorkspace {
    private Long workspaceId;
    private String workspaceName;
    private Set<String> permissions;
}
