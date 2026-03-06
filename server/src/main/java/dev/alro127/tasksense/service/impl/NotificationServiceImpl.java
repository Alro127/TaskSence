package dev.alro127.tasksense.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.alro127.tasksense.domain.entity.NotificationEntity;
import dev.alro127.tasksense.dto.common.NotificationResponse;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.util.redis.RedisKeys;
import dev.alro127.tasksense.repository.jpa.NotificationRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final SecurityService securityService;

    @Override
    public List<NotificationResponse> getMyNotifications(Long cursor, int limit) {

        Long userId = securityService.getCurrentUserId();

        if (cursor == null) {

            String cacheKey = RedisKeys.recent(userId);

            List<NotificationResponse> cached =
                    (List<NotificationResponse>) redisTemplate.opsForValue().get(cacheKey);

            if (cached != null) {
                return cached;
            }

            List<NotificationResponse> notifications =
                    repository.findTop20ByReceiverIdOrderByIdDesc(userId)
                            .stream()
                            .map(NotificationResponse::mapToResponse)
                            .toList();

            redisTemplate.opsForValue()
                    .set(cacheKey, notifications, 30, TimeUnit.SECONDS);

            return notifications;
        }

        return repository.findNotifications(
                        userId,
                        cursor,
                        PageRequest.of(0, limit)
                )
                .stream()
                .map(NotificationResponse::mapToResponse)
                .toList();
    }

    @Override
    public long getUnreadCount() {

        Long userId = securityService.getCurrentUserId();

        String key = RedisKeys.unreadCount(userId);
        Object value = redisTemplate.opsForValue().get(key);

        if (value != null) {
            return Long.parseLong(value.toString());
        }

        long count = repository.countByReceiverIdAndReadAtIsNull(userId);

        redisTemplate.opsForValue().set(key, count);

        return count;
    }

    @Override
    public void markAsRead(Long notificationId) {

        Long userId = securityService.getCurrentUserId();

        NotificationEntity notification =
                repository.findById(notificationId)
                        .orElseThrow();

        if (notification.getReadAt() == null) {
            notification.setReadAt(OffsetDateTime.now());
            repository.save(notification);

            redisTemplate.opsForValue()
                    .decrement(RedisKeys.unreadCount(userId));
        }
    }

    @Override
    @Transactional
    public int markAllAsRead() {

        Long userId = securityService.getCurrentUserId();

        int updated = repository.markAllAsRead(userId);

        redisTemplate.delete(RedisKeys.recent(userId));

        return updated;
    }

    @Transactional
    @Override
    public void deleteNotification(Long id) {

        Long userId = securityService.getCurrentUserId();

        repository.deleteNotification(id, userId);

        redisTemplate.delete(RedisKeys.recent(userId));
    }

    @Transactional
    @Override
    public int deleteNotifications(List<Long> ids) {

        Long userId = securityService.getCurrentUserId();

        int deleted = repository.deleteNotifications(ids, userId);

        redisTemplate.delete(RedisKeys.recent(userId));

        return deleted;
    }
}