package dev.alro127.tasksense.service.publisher;

import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.dto.message.EmailMessage;
import dev.alro127.tasksense.util.redis.RedisKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailPublisher implements Publisher {
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public OutboxEventType eventType() {
        return OutboxEventType.EMAIL;
    }

    @Override
    public void publish(Object message) {

        try {

            redisTemplate.convertAndSend(
                    RedisKeys.AUTH_EMAIL_CHANNEL,
                    message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to publish notification", e);
        }
    }
}
