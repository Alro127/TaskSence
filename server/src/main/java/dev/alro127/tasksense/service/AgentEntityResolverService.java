package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.agent.AgentResolutionResponse;
import dev.alro127.tasksense.dto.agent.AgentResolvedProject;
import dev.alro127.tasksense.dto.agent.AgentResolvedTask;
import dev.alro127.tasksense.dto.agent.AgentResolvedWorkspace;
import dev.alro127.tasksense.security.permission.ProjectPermission;
import dev.alro127.tasksense.security.permission.WorkspacePermission;

public interface AgentEntityResolverService {
    AgentResolutionResponse<AgentResolvedWorkspace> resolveWorkspace(
            Long workspaceId,
            String workspaceName,
            WorkspacePermission requiredPermission);

    AgentResolutionResponse<AgentResolvedProject> resolveProject(
            Long projectId,
            String projectName,
            Long workspaceId,
            String workspaceName,
            ProjectPermission requiredPermission);

    AgentResolutionResponse<AgentResolvedTask> resolveTask(
            Long taskId,
            String taskTitle,
            Long projectId,
            String projectName,
            Long workspaceId,
            String workspaceName,
            ProjectPermission requiredProjectPermission);
}
