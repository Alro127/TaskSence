package dev.alro127.tasksense.worker.es;

import dev.alro127.tasksense.domain.entity.OutboxEventEntity;
import dev.alro127.tasksense.domain.enums.DeliveryStatus;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.event.EntityChangedEvent;
import dev.alro127.tasksense.repository.jpa.*;
import dev.alro127.tasksense.service.SearchIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class EntityChangedEventListener {

    private static final int MAX_RETRIES = 3;
    private static final long[] BACKOFF_MS = { 500, 1_000, 2_000 };

    private final SearchIndexService searchIndexService;
    private final OutboxEventRepository outboxEventRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handle(EntityChangedEvent event) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                applyToEs(event);
                return;
            } catch (Exception e) {
                lastException = e;
                log.warn("ES sync attempt {}/{} failed for {} id={} op={}",
                        attempt, MAX_RETRIES, event.entityType(), event.entityId(), event.operation());
                if (attempt < MAX_RETRIES) {
                    sleep(BACKOFF_MS[attempt - 1]);
                }
            }
        }

        saveToOutbox(event, lastException);
    }

    private void applyToEs(EntityChangedEvent event) {
        if (event.operation() == EntityChangedEvent.Operation.DELETE) {
            deleteFromEs(event.entityType(), event.entityId());
        } else {
            upsertToEs(event.entityType(), event.entityId());
        }
    }

    private void upsertToEs(EntityType entityType, Long entityId) {
        switch (entityType) {
            case USER -> userRepository.findById(entityId)
                    .ifPresent(searchIndexService::indexUser);
            case PROJECT -> projectRepository.findByIdWithWorkspace(entityId)
                    .ifPresent(searchIndexService::indexProject);
            case TASK -> taskRepository.findByIdWithAssociations(entityId)
                    .ifPresent(searchIndexService::indexTask);
            case COMMENT -> commentRepository.findByIdWithAssociations(entityId)
                    .ifPresent(searchIndexService::indexComment);
            default -> log.warn("Unsupported entity type for ES upsert: {}", entityType);
        }
    }

    private void deleteFromEs(EntityType entityType, Long entityId) {
        switch (entityType) {
            case USER -> searchIndexService.removeUser(entityId);
            case PROJECT -> searchIndexService.removeProject(entityId);
            case TASK -> searchIndexService.removeTask(entityId);
            case COMMENT -> searchIndexService.removeComment(entityId);
            default -> log.warn("Unsupported entity type for ES delete: {}", entityType);
        }
    }

    private void saveToOutbox(EntityChangedEvent event, Exception cause) {
        try {
            OutboxEventEntity outboxEvent = OutboxEventEntity.builder()
                    .eventType(OutboxEventType.ES_SYNC)
                    .entityType(event.entityType())
                    .entityId(event.entityId())
                    .payload(Map.of("operation", event.operation().name()))
                    .deliveryStatus(DeliveryStatus.PENDING)
                    .retryCount(0)
                    .build();
            outboxEventRepository.save(outboxEvent);
            log.warn("Saved ES_SYNC event to outbox for {} id={} op={}",
                    event.entityType(), event.entityId(), event.operation(), cause);
        } catch (Exception e) {
            log.error("Failed to save ES_SYNC to outbox for {} id={}", event.entityType(), event.entityId(), e);
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
