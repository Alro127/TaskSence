package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkflowEntity;
import dev.alro127.tasksense.domain.entity.WorkflowFavoriteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;

@Repository
public interface WorkflowFavoriteRepository extends JpaRepository<WorkflowFavoriteEntity, Long> {

    @Query("""
            SELECT wf.workflow FROM WorkflowFavoriteEntity wf
            WHERE wf.user.id = :userId
            ORDER BY wf.createdAt DESC
            """)
    Page<WorkflowEntity> findFavoritedWorkflowsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT wf.workflow.id FROM WorkflowFavoriteEntity wf
            WHERE wf.user.id = :userId
              AND wf.workflow.id IN :workflowIds
            """)
    Set<Long> findFavoritedWorkflowIdsByUserIdAndWorkflowIdIn(
            @Param("userId") Long userId,
            @Param("workflowIds") Collection<Long> workflowIds);

    Optional<WorkflowFavoriteEntity> findByWorkflowIdAndUserId(Long workflowId, Long userId);

    boolean existsByWorkflowIdAndUserId(Long workflowId, Long userId);

    void deleteByWorkflowIdAndUserId(Long workflowId, Long userId);

    void deleteByWorkflowId(Long workflowId);
}
