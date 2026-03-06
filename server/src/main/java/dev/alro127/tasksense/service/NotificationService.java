package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.NotificationResponse;
import jakarta.transaction.Transactional;

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
}
