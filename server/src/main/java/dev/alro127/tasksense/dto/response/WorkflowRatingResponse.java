package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class WorkflowRatingResponse {

    private Long workflowId;

    private Long userId;

    private Integer stars;

    private String reviewText;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;
}
