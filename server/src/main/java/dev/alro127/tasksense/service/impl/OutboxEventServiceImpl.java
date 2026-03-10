package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.OutboxEventEntity;
import dev.alro127.tasksense.domain.enums.DeliveryStatus;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.repository.jpa.OutboxEventRepository;
import dev.alro127.tasksense.service.OutboxEventService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class OutboxEventServiceImpl implements OutboxEventService {

    private final OutboxEventRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public Long publishEvent(
            OutboxEventType eventType,
            EntityType entityType,
            Long entityId,
            Object payload
    ) {

        String payloadJson;

        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize payload", e);
        }

        OutboxEventEntity event = OutboxEventEntity.builder()
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .payload(payloadJson)
                .deliveryStatus(DeliveryStatus.PENDING)
                .retryCount(0)
                .build();

        return repository.save(event).getId();
    }

    @Transactional
    @Override
    public void markSuccess(Long id) {

        repository.updateStatus(
                id,
                DeliveryStatus.SUCCESS,
                OffsetDateTime.now()
        );
    }
}
