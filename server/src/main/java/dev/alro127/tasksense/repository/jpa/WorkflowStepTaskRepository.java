package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.WorkflowStepTaskEntity;

import java.util.List;

@Repository
public interface WorkflowStepTaskRepository extends JpaRepository<WorkflowStepTaskEntity, Long> {

    void deleteByWorkflowStepIdIn(List<Long> workflowStepIds);

    List<WorkflowStepTaskEntity> findAllByWorkflowStepIdIn(List<Long> workflowStepIds);
}
