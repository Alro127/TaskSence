package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.alro127.tasksense.domain.entity.CommentEntity;

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
            Pageable pageable);

    // ===== Cascade soft-delete =====

    /**
     * Soft-deletes all direct replies of the given parent comment that have not
     * yet been deleted.  Uses a native query to bypass the
     * {@code @SQLRestriction("deleted_at IS NULL")} filter on the entity so we
     * can always reach the rows regardless of their current state.
     */
    @Modifying
    @Query(
        value = "UPDATE comments SET deleted_at = :now WHERE parent_comment_id = :parentId AND deleted_at IS NULL",
        nativeQuery = true
    )
    void softDeleteRepliesByParentId(@Param("parentId") Long parentId, @Param("now") OffsetDateTime now);

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
