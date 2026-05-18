package dev.alro127.tasksense.dto.agent;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentConfirmationRequiredResponse {
    private String status;
    private String action;
    private String message;
    private String confirmationToken;
    private String expiresAt;
    private String proposedChangesHash;
    private Object target;
    private Object proposedChanges;
}
