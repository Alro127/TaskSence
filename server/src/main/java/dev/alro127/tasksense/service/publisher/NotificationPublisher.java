package dev.alro127.tasksense.service.publisher;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    public void publish(NotificationMessage message) {

        try {

            redisTemplate.convertAndSend(
                    RedisKeys.NOTIFICATION_CHANNEL,
                    message
            );

        } catch (Exception e) {
            throw new RuntimeException("Failed to publish notification", e);
        }
    }
}
