package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkflowFavoriteToggleResponse {

    private Long workflowId;

    private boolean favorited;
}
