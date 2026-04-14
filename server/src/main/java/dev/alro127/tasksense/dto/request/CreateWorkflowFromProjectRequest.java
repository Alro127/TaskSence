package dev.alro127.tasksense.dto.request;

import lombok.Data;

@Data
public class CreateWorkflowFromProjectRequest {

    private Boolean includeSubtasks;

    private Boolean includeCompletedTasks;

    private Boolean useAiRefinement;
}
