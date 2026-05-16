package dev.alro127.tasksense.dto.agent;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AgentResolutionResponse<T> {
    private AgentResolutionStatus status;
    private String message;
    private T selected;
    private List<T> candidates;

    public boolean isResolved() {
        return status == AgentResolutionStatus.RESOLVED && selected != null;
    }
}
