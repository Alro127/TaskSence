package dev.alro127.tasksense.service;

import org.springframework.transaction.annotation.Transactional;

import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;

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
