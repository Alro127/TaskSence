package dev.alro127.tasksense.dto.common;

import dev.alro127.tasksense.domain.entity.NotificationEntity;
import dev.alro127.tasksense.domain.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;
import java.util.Map;

@Getter
@Builder
public class NotificationResponse {

    private Long id;

    private NotificationType type;

    private Long actorId;
    private Long receiverId;

    private String referenceType;
    private Long referenceId;

    private Map<String, Object> payload;

    private boolean isRead;

    private OffsetDateTime createdAt;

    public static NotificationResponse mapToResponse(
            NotificationEntity entity
    ) {
        return NotificationResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .actorId(entity.getActorId())
                .receiverId(entity.getReceiver().getId())
                .referenceType(entity.getReferenceType())
                .referenceId(entity.getReferenceId())
                .payload(entity.getPayload())
                .isRead(entity.getReadAt() != null)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}