package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.CommentEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    @Query("""
        SELECT c
        FROM CommentEntity c
        JOIN FETCH c.user
        LEFT JOIN FETCH c.parentComment
        WHERE c.task.id = :taskId
        AND c.deletedAt IS NULL
        AND (:cursor IS NULL OR c.id < :cursor)
        ORDER BY c.id DESC
    """)
    List<CommentEntity> findComments(
            Long taskId,
            Long cursor,
            Pageable pageable
    );
}