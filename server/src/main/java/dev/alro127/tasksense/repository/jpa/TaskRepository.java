package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

  List<TaskEntity> findByProjectId(Long projectId);

  List<TaskEntity> findByProjectIdAndStatus(Long projectId, TaskStatus status);

  List<TaskEntity> findByParentTaskId(Long parentTaskId);

  Optional<TaskEntity> findByIdAndProjectId(Long id, Long projectId);

  @Query("""
          SELECT DISTINCT t FROM TaskEntity t
          LEFT JOIN t.assignees a
          WHERE t.project.id = :projectId
            AND (:cursor IS NULL OR t.id < :cursor)
            AND (:status IS NULL OR t.status = :status)
            AND (:priority IS NULL OR t.priority = :priority)
            AND (:assigneeId IS NULL OR a.id = :assigneeId)
            AND (:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
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
      @Param("cursor") Long cursor,
      @Param("limit") int limit);
}
