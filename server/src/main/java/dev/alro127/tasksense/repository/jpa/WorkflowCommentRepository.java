package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import dev.alro127.tasksense.domain.entity.WorkflowCommentEntity;

import java.util.List;

public interface WorkflowCommentRepository extends JpaRepository<WorkflowCommentEntity, Long> {

    @Query("""
                SELECT c
                FROM WorkflowCommentEntity c
                JOIN FETCH c.user
                WHERE c.workflow.id = :workflowId
                AND c.parentComment IS NULL
                AND c.deletedAt IS NULL
                AND (
                    (:sort = 'desc' AND (:cursor IS NULL OR c.id < :cursor)) OR
                    (:sort = 'asc' AND (:cursor IS NULL OR c.id > :cursor))
                )
                ORDER BY
                    CASE WHEN :sort = 'desc' THEN c.id END DESC,
                    CASE WHEN :sort = 'asc' THEN c.id END ASC
            """)
    List<WorkflowCommentEntity> findTopLevelComments(
            Long workflowId,
            Long cursor,
            String sort,
            Pageable pageable);

    @Query("""
                SELECT c
                FROM WorkflowCommentEntity c
                JOIN FETCH c.user
                WHERE c.parentComment.id = :parentId
                AND c.deletedAt IS NULL
                AND (:cursor IS NULL OR c.id > :cursor)
                ORDER BY c.id ASC
            """)
    List<WorkflowCommentEntity> findReplies(
            Long parentId,
            Long cursor,
            Pageable pageable);

    @Query("""
                SELECT c.parentComment.id, COUNT(c)
                FROM WorkflowCommentEntity c
                WHERE c.parentComment.id IN :parentIds
                AND c.deletedAt IS NULL
                GROUP BY c.parentComment.id
            """)
    List<Object[]> countRepliesByParentIds(List<Long> parentIds);
}
