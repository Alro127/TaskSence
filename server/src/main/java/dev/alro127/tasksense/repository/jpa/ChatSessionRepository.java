package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.ChatSessionEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSessionEntity, Long> {

    @Query("""
        SELECT s FROM ChatSessionEntity s
        WHERE s.user.id = :userId
        AND (:cursor IS NULL OR s.id < :cursor)
        ORDER BY s.id DESC
        """)
    List<ChatSessionEntity> findSessionsByUser(Long userId, Long cursor, Pageable pageable);

    @Query("""
        SELECT s FROM ChatSessionEntity s
        WHERE s.id = :id AND s.user.id = :userId
        """)
    Optional<ChatSessionEntity> findByIdAndUserId(Long id, Long userId);

    @Modifying
    @Query("""
        UPDATE ChatSessionEntity s
        SET s.deletedAt = CURRENT_TIMESTAMP
        WHERE s.id = :id AND s.user.id = :userId
        """)
    int softDeleteByIdAndUserId(Long id, Long userId);
}
