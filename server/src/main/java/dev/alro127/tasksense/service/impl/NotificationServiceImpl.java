package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.NotificationEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.OutboxEventType;
import dev.alro127.tasksense.dto.common.NotificationResponse;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.OutboxEventService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.publisher.NotificationPublisher;
import dev.alro127.tasksense.util.redis.RedisKeys;
import dev.alro127.tasksense.repository.jpa.NotificationRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;
    private final SecurityService securityService;
    private final NotificationPublisher notificationPublisher;
    private final OutboxEventService outboxEventService;

    @Override
    public List<NotificationResponse> getMyNotifications(Long cursor, int limit) {

        Long userId = securityService.getCurrentUserId();

        if (cursor == null) {

            String cacheKey = RedisKeys.recent(userId);

            List<NotificationResponse> cached = (List<NotificationResponse>) redisTemplate.opsForValue().get(cacheKey);

            if (cached != null) {
                return cached;
            }

            List<NotificationResponse> notifications = repository.findTop20ByReceiverIdOrderByIdDesc(userId)
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
                PageRequest.of(0, limit))
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

        System.out.println("unread count:" + count);

        redisTemplate.opsForValue().set(key, count, Duration.ofHours(1));

        return count;
    }

    @Override
    public void markAsRead(Long notificationId) {

        Long userId = securityService.getCurrentUserId();

        NotificationEntity notification = repository.findById(notificationId)
                .orElseThrow();

        if (!notification.getReceiver().getId().equals(userId)) {
            throw new ForbiddenException("You don't have right to take this action");
        }

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

        redisTemplate.opsForValue().set(
                RedisKeys.unreadCount(userId),
                0);

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

    @Transactional
    @Override
    public void saveAndPublish(NotificationMessage message) {

        UserEntity receiver = userRepository.findById(message.getReceiverId()).orElse(null);

        if (receiver == null) {
            System.out.println("Receiver is null");
            return;
        }

        NotificationEntity entity = NotificationEntity.builder()
                .receiver(receiver)
                .actorId(message.getActorId())
                .type(message.getType())
                .referenceType(message.getReferenceType())
                .referenceId(message.getReferenceId())
                .payload(message.getPayload())
                .build();

        NotificationEntity saved = repository.save(entity);

        message.setId(saved.getId());
        message.setReceiverEmail(receiver.getEmail());

        Long outboxId = outboxEventService.publishEvent(
                OutboxEventType.NOTIFICATION,
                EntityType.NOTIFICATION,
                saved.getId(),
                message);

        try {

            notificationPublisher.publish(message);
            outboxEventService.markSuccess(outboxId);

        } catch (Exception e) {

            System.out.println("Realtime publish failed, worker will retry");

        }
    }
}