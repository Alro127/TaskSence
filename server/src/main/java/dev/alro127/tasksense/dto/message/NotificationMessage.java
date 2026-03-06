package dev.alro127.tasksense.dto.message;

import dev.alro127.tasksense.domain.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.checkerframework.checker.units.qual.A;

import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationMessage {
    private Long receiverId;
    private Long actorId;
    private NotificationType type;

    private String referenceType;
    private Long referenceId;

    private Map<String, Object> payload;
}
