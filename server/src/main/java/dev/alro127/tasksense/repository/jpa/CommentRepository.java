package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.CommentEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

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

    // ===== ES sync queries =====

    @Query("SELECT c.id FROM CommentEntity c WHERE c.updatedAt > :since ORDER BY c.id ASC")
    List<Long> findIdsSince(@Param("since") OffsetDateTime since, Pageable pageable);

    @Query("""
        SELECT c FROM CommentEntity c
        JOIN FETCH c.task t
        JOIN FETCH t.project p
        JOIN FETCH p.workspace
        JOIN FETCH c.user
        LEFT JOIN FETCH c.parentComment
        WHERE c.id IN :ids
    """)
    List<CommentEntity> findAllByIdsWithAssociations(@Param("ids") List<Long> ids);

    @Query("""
        SELECT c FROM CommentEntity c
        JOIN FETCH c.task t
        JOIN FETCH t.project p
        JOIN FETCH p.workspace
        JOIN FETCH c.user
        LEFT JOIN FETCH c.parentComment
        WHERE c.id = :id
    """)
    Optional<CommentEntity> findByIdWithAssociations(@Param("id") Long id);
}
