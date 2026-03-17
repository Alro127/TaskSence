package dev.alro127.tasksense.worker.es;

import dev.alro127.tasksense.domain.entity.OutboxEventEntity;
import dev.alro127.tasksense.domain.enums.DeliveryStatus;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.event.EntityChangedEvent.Operation;
import dev.alro127.tasksense.repository.jpa.OutboxEventRepository;
import dev.alro127.tasksense.service.SearchIndexService;
import dev.alro127.tasksense.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class EsOutboxWorker {

    private final OutboxEventRepository outboxEventRepository;
    private final SearchIndexService searchIndexService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;

    @Scheduled(fixedDelay = 30_000)
    public void processFailedEsSyncEvents() {
        while (true) {
            List<OutboxEventEntity> events = outboxEventRepository
                    .lockEventsForProcessing(OutboxEventType.ES_SYNC.name(), 100);
            if (events.isEmpty()) break;

            for (OutboxEventEntity event : events) {
                try {
                    Operation operation = resolveOperation(event);
                    if (operation == Operation.DELETE) {
                        deleteFromEs(event);
                    } else {
                        upsertToEs(event);
                    }
                    event.setDeliveryStatus(DeliveryStatus.SUCCESS);
                    event.setPublishedAt(OffsetDateTime.now());
                    log.debug("ES_SYNC outbox processed: {} id={}", event.getEntityType(), event.getEntityId());
                } catch (Exception e) {
                    event.setRetryCount(event.getRetryCount() + 1);
                    event.setDeliveryStatus(DeliveryStatus.FAILED);
                    log.error("ES_SYNC outbox failed for {} id={}", event.getEntityType(), event.getEntityId(), e);
                }
                outboxEventRepository.save(event);
            }
        }
    }

    private Operation resolveOperation(OutboxEventEntity event) {
        if (event.getPayload() instanceof Map<?, ?> map) {
            Object op = map.get("operation");
            if (op != null) {
                return Operation.valueOf(op.toString());
            }
        }
        return Operation.UPSERT;
    }

    private void upsertToEs(OutboxEventEntity event) {
        Long entityId = event.getEntityId();
        switch (event.getEntityType()) {
            case USER -> userRepository.findById(entityId)
                    .ifPresent(searchIndexService::indexUser);
            case PROJECT -> projectRepository.findByIdWithWorkspace(entityId)
                    .ifPresent(searchIndexService::indexProject);
            case TASK -> taskRepository.findByIdWithAssociations(entityId)
                    .ifPresent(searchIndexService::indexTask);
            case COMMENT -> commentRepository.findByIdWithAssociations(entityId)
                    .ifPresent(searchIndexService::indexComment);
            default -> log.warn("Unsupported entity type for ES upsert: {}", event.getEntityType());
        }
    }

    private void deleteFromEs(OutboxEventEntity event) {
        Long entityId = event.getEntityId();
        switch (event.getEntityType()) {
            case USER -> searchIndexService.removeUser(entityId);
            case PROJECT -> searchIndexService.removeProject(entityId);
            case TASK -> searchIndexService.removeTask(entityId);
            case COMMENT -> searchIndexService.removeComment(entityId);
            default -> log.warn("Unsupported entity type for ES delete: {}", event.getEntityType());
        }
    }
}
