package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

  List<TaskEntity> findByProjectId(Long projectId);

  List<TaskEntity> findByProjectIdAndStatus(Long projectId, TaskStatus status);

  List<TaskEntity> findByParentTaskId(Long parentTaskId);

  Optional<TaskEntity> findByIdAndProjectId(Long id, Long projectId);

  @Query("""
  SELECT t
  FROM TaskEntity t
  LEFT JOIN FETCH t.assignees
  WHERE t.id = :id
  """)
  Optional<TaskEntity> findWithAssignees(Long id);

  @Query("""
          SELECT DISTINCT t FROM TaskEntity t
          LEFT JOIN t.assignees a
          WHERE t.project.id = :projectId
            AND (:status IS NULL OR t.status = :status)
            AND (:priority IS NULL OR t.priority = :priority)
            AND (:assigneeId IS NULL OR a.id = :assigneeId)
            AND (:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            AND (:dueDateFrom IS NULL OR t.dueDate >= :dueDateFrom)
            AND (:dueDateTo IS NULL OR t.dueDate <= :dueDateTo)
          ORDER BY t.position ASC, t.id DESC
      """)
  List<TaskEntity> searchTasks(
      @Param("projectId") Long projectId,
      @Param("status") TaskStatus status,
      @Param("priority") TaskPriority priority,
      @Param("assigneeId") Long assigneeId,
      @Param("keyword") String keyword,
      @Param("dueDateFrom") LocalDate dueDateFrom,
      @Param("dueDateTo") LocalDate dueDateTo,
      Pageable pageable);

  @Query("""
    SELECT t
    FROM TaskEntity t
    WHERE t.due_date BETWEEN :now AND :window
    """)
  List<TaskEntity> findTasksWithReminderBetween(
          OffsetDateTime now,
          OffsetDateTime window);
}
