package dev.alro127.tasksense.worker.es;

import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.domain.enums.DeliveryStatus;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.repository.jpa.*;
import dev.alro127.tasksense.service.SearchIndexService;
import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.function.Consumer;

@Component
@RequiredArgsConstructor
@Slf4j
public class SyncEsWorker {

    private static final int BATCH_SIZE = 500;
    private static final int MAX_RETRIES = 3;
    private static final long[] BACKOFF_MS = { 1_000, 2_000, 4_000 };

    // Fallback khi chưa có last sync time: sync toàn bộ lịch sử
    private static final OffsetDateTime EPOCH = OffsetDateTime.parse("2000-01-01T00:00:00+00:00");

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final SearchIndexService searchIndexService;
    private final StringRedisTemplate redisTemplate;

    @Scheduled(cron = "0 */5 * * * *")
    public void syncAll() {
        // Ghi lại thời điểm BẮT ĐẦU sync để không bỏ sót records được update trong khi
        // đang sync
        OffsetDateTime syncStartTime = OffsetDateTime.now();
        OffsetDateTime since = readLastSyncTime();

        log.info("ES incremental sync started — since={}", since);

        retryFailedEsEvents();
        syncUsers(since);
        syncProjects(since);
        syncTasks(since);
        syncComments(since);

        // Chỉ cập nhật last sync time sau khi toàn bộ hoàn thành
        saveLastSyncTime(syncStartTime);
        log.info("ES incremental sync completed — next sync will be since={}", syncStartTime);
    }

    // ===== Phase 1: retry failed outbox ES_SYNC events =====

    private void retryFailedEsEvents() {
        while (true) {
            List<OutboxEventEntity> events = outboxEventRepository
                    .lockEventsForProcessing(OutboxEventType.ES_SYNC.name(), BATCH_SIZE);
            if (events.isEmpty())
                break;

            for (OutboxEventEntity event : events) {
                try {
                    reIndexById(event.getEntityType(), event.getEntityId());
                    event.setDeliveryStatus(DeliveryStatus.SUCCESS);
                    event.setPublishedAt(OffsetDateTime.now());
                    log.debug("Re-indexed {} id={}", event.getEntityType(), event.getEntityId());
                } catch (Exception e) {
                    event.setRetryCount(event.getRetryCount() + 1);
                    event.setDeliveryStatus(DeliveryStatus.FAILED);
                    log.error("Retry ES sync failed for {} id={}", event.getEntityType(), event.getEntityId(), e);
                }
                outboxEventRepository.save(event);
            }
        }
    }

    private void reIndexById(EntityType entityType, Long entityId) {
        switch (entityType) {
            case USER -> userRepository.findById(entityId)
                    .ifPresent(searchIndexService::indexUser);
            case PROJECT -> projectRepository.findByIdWithWorkspace(entityId)
                    .ifPresent(searchIndexService::indexProject);
            case TASK -> taskRepository.findByIdWithAssociations(entityId)
                    .ifPresent(searchIndexService::indexTask);
            case COMMENT -> commentRepository.findByIdWithAssociations(entityId)
                    .ifPresent(searchIndexService::indexComment);
            default -> log.warn("Unsupported ES entity type: {}", entityType);
        }
    }

    // ===== Phase 2: incremental sync =====

    private void syncUsers(OffsetDateTime since) {
        log.info("Syncing users since={}", since);
        int page = 0;
        while (true) {
            List<UserEntity> batch = userRepository.findSince(since, PageRequest.of(page, BATCH_SIZE));
            if (batch.isEmpty())
                break;
            indexWithRetry(batch, EntityType.USER, searchIndexService::indexUsers);
            if (batch.size() < BATCH_SIZE)
                break;
            page++;
        }
    }

    private void syncProjects(OffsetDateTime since) {
        log.info("Syncing projects since={}", since);
        int page = 0;
        while (true) {
            List<Long> ids = projectRepository.findIdsSince(since, PageRequest.of(page, BATCH_SIZE));
            if (ids.isEmpty())
                break;
            List<ProjectEntity> batch = projectRepository.findAllByIdsWithWorkspace(ids);
            indexWithRetry(batch, EntityType.PROJECT, searchIndexService::indexProjects);
            if (ids.size() < BATCH_SIZE)
                break;
            page++;
        }
    }

    private void syncTasks(OffsetDateTime since) {
        log.info("Syncing tasks since={}", since);
        int page = 0;
        while (true) {
            List<Long> ids = taskRepository.findIdsSince(since, PageRequest.of(page, BATCH_SIZE));
            if (ids.isEmpty())
                break;
            List<TaskEntity> batch = taskRepository.findAllByIdsWithAssociations(ids);
            indexWithRetry(batch, EntityType.TASK, searchIndexService::indexTasks);
            if (ids.size() < BATCH_SIZE)
                break;
            page++;
        }
    }

    private void syncComments(OffsetDateTime since) {
        log.info("Syncing comments since={}", since);
        int page = 0;
        while (true) {
            List<Long> ids = commentRepository.findIdsSince(since, PageRequest.of(page, BATCH_SIZE));
            if (ids.isEmpty())
                break;
            List<CommentEntity> batch = commentRepository.findAllByIdsWithAssociations(ids);
            indexWithRetry(batch, EntityType.COMMENT, searchIndexService::indexComments);
            if (ids.size() < BATCH_SIZE)
                break;
            page++;
        }
    }

    // ===== Retry + outbox fallback =====

    private <T> void indexWithRetry(List<T> batch, EntityType entityType, Consumer<List<T>> indexFn) {
        Exception lastException = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                indexFn.accept(batch);
                return;
            } catch (Exception e) {
                lastException = e;
                log.warn("ES batch index attempt {}/{} failed for {}: {}",
                        attempt, MAX_RETRIES, entityType, e.getMessage());
                if (attempt < MAX_RETRIES) {
                    sleep(BACKOFF_MS[attempt - 1]);
                }
            }
        }
        log.error("All {} retries exhausted for {} batch size={}, saving to outbox",
                MAX_RETRIES, entityType, batch.size(), lastException);
        saveFailedBatchToOutbox(batch, entityType);
    }

    private <T> void saveFailedBatchToOutbox(List<T> batch, EntityType entityType) {
        List<OutboxEventEntity> events = batch.stream()
                .map(entity -> OutboxEventEntity.builder()
                        .eventType(OutboxEventType.ES_SYNC)
                        .entityType(entityType)
                        .entityId(extractId(entity, entityType))
                        .deliveryStatus(DeliveryStatus.PENDING)
                        .retryCount(0)
                        .build())
                .toList();
        outboxEventRepository.saveAll(events);
        log.info("Saved {} failed ES_SYNC events to outbox for {}", events.size(), entityType);
    }

    private <T> Long extractId(T entity, EntityType entityType) {
        return switch (entityType) {
            case USER -> ((UserEntity) entity).getId();
            case PROJECT -> ((ProjectEntity) entity).getId();
            case TASK -> ((TaskEntity) entity).getId();
            case COMMENT -> ((CommentEntity) entity).getId();
            default -> throw new IllegalArgumentException("Unsupported entity type: " + entityType);
        };
    }

    // ===== Redis helpers =====

    private OffsetDateTime readLastSyncTime() {
        String value = redisTemplate.opsForValue().get(RedisKeys.ES_LAST_SYNC_TIME);
        if (value == null) {
            log.info("No last sync time found in Redis — performing full sync (since={})", EPOCH);
            return EPOCH;
        }
        return OffsetDateTime.parse(value, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    private void saveLastSyncTime(OffsetDateTime time) {
        redisTemplate.opsForValue().set(
                RedisKeys.ES_LAST_SYNC_TIME,
                time.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
