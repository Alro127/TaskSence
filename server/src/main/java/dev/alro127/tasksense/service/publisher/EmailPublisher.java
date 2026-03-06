package dev.alro127.tasksense.service.publisher;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.dto.message.EmailMessage;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.service.EmailService;
import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailPublisher {
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public void publish(EmailMessage message) {

        try {

            String json = objectMapper.writeValueAsString(message);

            redisTemplate.convertAndSend(
                    RedisKeys.AUTH_EMAIL_CHANNEL,
                    json
            );

        } catch (Exception e) {
            throw new RuntimeException("Failed to publish notification", e);
        }
    }
}
