package dev.alro127.tasksense.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

import static dev.alro127.tasksense.util.redis.RedisKeys.REMINDER_KEY;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final StringRedisTemplate redisTemplate;

    public void scheduleReminder(Long taskId, OffsetDateTime reminderTime) {

        long score = reminderTime.toInstant().toEpochMilli();

        redisTemplate.opsForZSet()
                .add(REMINDER_KEY, taskId.toString(), score);
    }

    public void removeReminder(Long taskId) {
        redisTemplate.opsForZSet()
                .remove(REMINDER_KEY, taskId.toString());
    }
}