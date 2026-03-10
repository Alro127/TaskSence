package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.OutboxEventEntity;
import dev.alro127.tasksense.domain.enums.DeliveryStatus;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import io.lettuce.core.dynamic.annotation.Param;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, Long> {

    @Modifying
    @Transactional
    @Query("""
    UPDATE OutboxEventEntity e
    SET e.deliveryStatus = :deliveryStatus,
        e.publishedAt = :publishedAt
    WHERE e.id = :id
""")
    void updateStatus(Long id, DeliveryStatus deliveryStatus, OffsetDateTime publishedAt);

    @Query(value = """
        SELECT *
        FROM outbox_events
        WHERE event_type = :eventType
        AND delivery_status IN ('PENDING','FAILED')
        AND retry_count < 5
        ORDER BY created_at
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<OutboxEventEntity> lockEventsForProcessing(
            @Param("eventType") String eventType,
            @Param("limit") int limit);
}