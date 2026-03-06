package dev.alro127.tasksense.util.redis;

public class RedisKeys {

    public static final String NOTIFICATION_CHANNEL = "notification-channel";
    public static final String AUTH_EMAIL_CHANNEL = "auth-email-channel";

    public static String unreadCount(Long userId) {
        return "notification:unread:" + userId;
    }

    public static String recent(Long userId) {
        return "notification:recent:" + userId;
    }
}
