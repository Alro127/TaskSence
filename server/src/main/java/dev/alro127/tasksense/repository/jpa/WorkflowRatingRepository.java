package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.WorkflowRatingEntity;

import java.util.Optional;

@Repository
public interface WorkflowRatingRepository extends JpaRepository<WorkflowRatingEntity, Long> {

    Optional<WorkflowRatingEntity> findByWorkflowIdAndUserId(Long workflowId, Long userId);

    long countByWorkflowId(Long workflowId);

    @Query("SELECT AVG(r.stars) FROM WorkflowRatingEntity r WHERE r.workflow.id = :workflowId")
    Double findAverageStarsByWorkflowId(@Param("workflowId") Long workflowId);

    void deleteByWorkflowId(Long workflowId);
}
