package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkflowRatingSummaryResponse {

    private Long workflowId;

    private Double averageStars;

    private Long totalRatings;
}
