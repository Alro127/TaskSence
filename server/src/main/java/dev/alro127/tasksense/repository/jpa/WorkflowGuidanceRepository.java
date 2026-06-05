package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkflowGuidanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkflowGuidanceRepository extends JpaRepository<WorkflowGuidanceEntity, Long> {

    Optional<WorkflowGuidanceEntity> findByWorkflowIdAndPublicationVersion(Long workflowId, Integer publicationVersion);

    Optional<WorkflowGuidanceEntity> findFirstByWorkflowIdOrderByPublicationVersionDesc(Long workflowId);
}
