package dev.alro127.tasksense.service.subcriber;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocketSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onMessage(Message message, byte @Nullable [] pattern) {

        System.out.println("SocketSubscriber received message");

        try {

            String body = new String(message.getBody());

            NotificationMessage notification =
                    objectMapper.readValue(body, NotificationMessage.class);

            messagingTemplate.convertAndSendToUser(
                    notification.getReceiverId().toString(),
                    "/queue/notifications",
                    notification
            );

        } catch (Exception e) {
            log.error("Failed to process socket message", e);
        }
    }
}
