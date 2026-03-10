package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.NotificationResponse;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(Long cursor, int limit);

    long getUnreadCount();

    void markAsRead(Long notificationId);

    @Transactional
    int markAllAsRead();

    @Transactional
    void deleteNotification(Long id);

    @Transactional
    int deleteNotifications(List<Long> ids);

    @Transactional
    void saveAndPublish(NotificationMessage message);
}
