package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class WorkflowStepResponse {

    private Long id;

    private String title;

    private String description;

    private Integer position;

    private String sourceType;

    private Long sourceSprintId;

    private List<WorkflowStepTaskSummaryResponse> tasks;
}
