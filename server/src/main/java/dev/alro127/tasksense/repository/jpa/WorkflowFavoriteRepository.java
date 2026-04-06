package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkflowFavoriteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkflowFavoriteRepository extends JpaRepository<WorkflowFavoriteEntity, Long> {

    Optional<WorkflowFavoriteEntity> findByWorkflowIdAndUserId(Long workflowId, Long userId);

    boolean existsByWorkflowIdAndUserId(Long workflowId, Long userId);

    void deleteByWorkflowIdAndUserId(Long workflowId, Long userId);
}
