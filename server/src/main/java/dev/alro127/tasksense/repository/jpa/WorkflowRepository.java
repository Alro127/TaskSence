package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkflowEntity;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<WorkflowEntity, Long> {

    Optional<WorkflowEntity> findByIdAndCreatedById(Long id, Long createdById);

    Page<WorkflowEntity> findByCreatedById(Long createdById, Pageable pageable);

    Page<WorkflowEntity> findByCreatedByIdAndStatus(Long createdById, WorkflowStatus status, Pageable pageable);
}
