package dev.alro127.tasksense.domain.entity;

import dev.alro127.tasksense.domain.enums.DeliveryStatus;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "outbox_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private OutboxEventType eventType;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private EntityType entityType;

    private Long entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object payload;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private DeliveryStatus deliveryStatus;

    private Integer retryCount;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    private OffsetDateTime publishedAt;
}