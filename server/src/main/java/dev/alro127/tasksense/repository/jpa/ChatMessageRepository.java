package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {

    @Query("""
        SELECT m FROM ChatMessageEntity m
        WHERE m.session.id = :sessionId
        ORDER BY m.createdAt ASC
        """)
    List<ChatMessageEntity> findBySessionId(Long sessionId);

    @Query("""
        SELECT m FROM ChatMessageEntity m
        WHERE m.session.id = :sessionId
        ORDER BY m.createdAt DESC
        LIMIT :limit
        """)
    List<ChatMessageEntity> findRecentBySessionId(Long sessionId, int limit);
}
