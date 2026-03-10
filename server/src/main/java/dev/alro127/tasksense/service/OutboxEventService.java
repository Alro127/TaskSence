package dev.alro127.tasksense.service;

import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

public interface OutboxEventService {

    @Transactional
    Long publishEvent(
            OutboxEventType eventType,
            EntityType entityType,
            Long entityId,
            Object payload);

    @Transactional
    void markSuccess(Long id);
}
