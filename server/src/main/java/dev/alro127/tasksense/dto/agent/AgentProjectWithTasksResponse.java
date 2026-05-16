package dev.alro127.tasksense.dto.agent;

import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.dto.response.TaskResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AgentProjectWithTasksResponse {
    private ProjectResponse project;
    private List<TaskResponse> tasks;
}
