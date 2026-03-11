package dev.alro127.tasksense.service.publisher;

import dev.alro127.tasksense.domain.enums.OutboxEventType;

public interface Publisher {

    OutboxEventType eventType();

    void publish(Object message);
}
