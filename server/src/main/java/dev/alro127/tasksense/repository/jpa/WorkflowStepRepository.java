package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.WorkflowStepEntity;

import java.util.List;

@Repository
public interface WorkflowStepRepository extends JpaRepository<WorkflowStepEntity, Long> {

    List<WorkflowStepEntity> findAllByWorkflowIdOrderByPositionAscIdAsc(Long workflowId);

    void deleteByWorkflowId(Long workflowId);
}
