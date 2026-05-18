package dev.alro127.tasksense.service;

import java.time.OffsetDateTime;

public interface AgentConfirmationService {
    ConfirmationTicket issue(String action, Object target, Object proposedChanges);

    void consume(String confirmationToken, String action, Object target, Object proposedChanges);

    record ConfirmationTicket(String token, OffsetDateTime expiresAt, String proposedChangesHash) {
    }
}
