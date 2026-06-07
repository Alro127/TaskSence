package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.WorkflowEntity;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowRepository extends JpaRepository<WorkflowEntity, Long> {

    Optional<WorkflowEntity> findByIdAndCreatedById(Long id, Long createdById);

    Optional<WorkflowEntity> findByIdAndStatus(Long id, WorkflowStatus status);

    Page<WorkflowEntity> findByCreatedById(Long createdById, Pageable pageable);

    Page<WorkflowEntity> findByCreatedByIdAndStatus(Long createdById, WorkflowStatus status, Pageable pageable);

    Page<WorkflowEntity> findByStatus(WorkflowStatus status, Pageable pageable);

    @Query("SELECT w FROM WorkflowEntity w WHERE w.status = :status AND (LOWER(w.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(COALESCE(w.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<WorkflowEntity> searchByStatusAndKeyword(@Param("status") WorkflowStatus status,
            @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT w.id FROM WorkflowEntity w WHERE w.project.id IN :projectIds")
    List<Long> findIdsByProjectIds(@Param("projectIds") List<Long> projectIds);

    @Modifying
    @Query("UPDATE WorkflowEntity w SET w.deletedAt = :now WHERE w.project.id IN :projectIds AND w.deletedAt IS NULL")
    void softDeleteByProjectIds(@Param("projectIds") List<Long> projectIds, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("UPDATE WorkflowEntity w SET w.deletedAt = :now WHERE w.project.id = :projectId AND w.deletedAt IS NULL")
    void softDeleteByProjectId(@Param("projectId") Long projectId, @Param("now") OffsetDateTime now);
}
