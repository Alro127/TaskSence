package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import dev.alro127.tasksense.domain.entity.NotificationEntity;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<NotificationEntity, Long> {

    long countByReceiverIdAndReadAtIsNull(Long receiverId);

    List<NotificationEntity> findTop20ByReceiverIdOrderByIdDesc(Long userId);

    @Query("""
            SELECT n FROM NotificationEntity n
            JOIN FETCH n.receiver
            WHERE n.receiver.id = :userId
            AND (:cursor IS NULL OR n.id < :cursor)
            ORDER BY n.id DESC
            """)
    List<NotificationEntity> findNotifications(
            Long userId,
            Long cursor,
            Pageable pageable);

    @Modifying
    @Query("""
            UPDATE NotificationEntity n
            SET n.readAt = CURRENT_TIMESTAMP
            WHERE n.receiver.id = :userId
            AND n.readAt IS NULL
            """)
    int markAllAsRead(Long userId);

    @Modifying
    @Query("""
                DELETE FROM NotificationEntity n
                WHERE n.id = :id
                AND n.receiver.id = :userId
            """)
    void deleteNotification(Long id, Long userId);

    @Modifying
    @Query("""
                DELETE FROM NotificationEntity n
                WHERE n.id IN :ids
                AND n.receiver.id = :userId
            """)
    int deleteNotifications(List<Long> ids, Long userId);
}
