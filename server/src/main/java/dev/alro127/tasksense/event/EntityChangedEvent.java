package dev.alro127.tasksense.event;

import dev.alro127.tasksense.domain.enums.EntityType;

public record EntityChangedEvent(EntityType entityType, Long entityId, Operation operation) {

    public enum Operation {
        UPSERT,
        DELETE
    }
}
