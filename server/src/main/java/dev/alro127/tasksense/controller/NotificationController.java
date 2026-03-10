package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.NotificationResponse;
import dev.alro127.tasksense.dto.request.DeleteNotificationsRequest;
import dev.alro127.tasksense.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit
    ) {

        List<NotificationResponse> notifications =
                notificationService.getMyNotifications(cursor, limit);

        ApiResponse<List<NotificationResponse>> response = new ApiResponse<>(
                "200",
                "Load notifications successfully",
                notifications,
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {

        Long count = notificationService.getUnreadCount();

        ApiResponse<Long> response = new ApiResponse<>(
                "200",
                "Get unread notification count successfully",
                count,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id
    ) {

        notificationService.markAsRead(id);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Notification marked as read",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead() {

        int updated = notificationService.markAllAsRead();

        ApiResponse<Integer> response = new ApiResponse<>(
                "200",
                "All notifications marked as read",
                updated,
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id
    ) {

        notificationService.deleteNotification(id);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete notification successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Integer>> deleteNotifications(
            @Valid @RequestBody DeleteNotificationsRequest request
    ) {

        int deleted = notificationService.deleteNotifications(request.getIds());

        ApiResponse<Integer> response = new ApiResponse<>(
                "200",
                "Delete notifications successfully",
                deleted,
                null
        );

        return ResponseEntity.ok(response);
    }

}