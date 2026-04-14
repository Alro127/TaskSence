package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkflowCommentEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface WorkflowCommentRepository extends JpaRepository<WorkflowCommentEntity, Long> {

    @Query("""
        SELECT c
        FROM WorkflowCommentEntity c
        JOIN FETCH c.user
        LEFT JOIN FETCH c.parentComment
        WHERE c.workflow.id = :workflowId
        AND c.deletedAt IS NULL
        AND (:cursor IS NULL OR c.id < :cursor)
        ORDER BY c.id DESC
    """)
    List<WorkflowCommentEntity> findComments(
            Long workflowId,
            Long cursor,
            Pageable pageable
    );
}
