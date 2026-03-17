package dev.alro127.tasksense.util.redis;

public class RedisKeys {

    public static final String NOTIFICATION_CHANNEL = "notification-channel";
    public static final String AUTH_EMAIL_CHANNEL = "auth-email-channel";
    public static final String REMINDER_KEY = "task:reminders";
    public static String refreshToken(String token) {
        return "refresh:token:" + token;
    }

    public static String resetToken(String token) {
        return "reset:token:" + token;
    }

    public static String unreadCount(Long userId) {
        return "notification:unread:" + userId;
    }

    public static String recent(Long userId) {
        return "notification:recent:" + userId;
    }

    public static String otp(String email) {
        return "OTP:" + email;
    }

    public static final String ES_LAST_SYNC_TIME = "es:last_sync_time";
}
