package dev.alro127.tasksense.dto.message;

import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.NotificationType;
import lombok.*;
import org.checkerframework.checker.units.qual.A;

import java.util.Map;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMessage {
    private Long id;
    private Long receiverId;
    private String receiverEmail;
    private Long actorId;
    private NotificationType type;

    private EntityType referenceType;
    private Long referenceId;

    private Map<String, Object> payload;
}
