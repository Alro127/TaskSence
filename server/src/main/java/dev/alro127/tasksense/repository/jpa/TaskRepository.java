package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

  List<TaskEntity> findByProjectId(Long projectId);

  List<TaskEntity> findByProjectIdAndStatus(Long projectId, TaskStatus status);

  List<TaskEntity> findByParentTaskId(Long parentTaskId);

  Optional<TaskEntity> findByIdAndProjectId(Long id, Long projectId);

  @Query(value = """
          SELECT DISTINCT t.* FROM tasks t
          LEFT JOIN task_assignees ta ON t.id = ta.task_id
          LEFT JOIN users u ON u.id = ta.user_id AND u.deleted_at IS NULL
          WHERE t.deleted_at IS NULL
            AND t.project_id = :projectId
            AND (CAST(:status AS VARCHAR) IS NULL OR t.status = CAST(:status AS VARCHAR))
            AND (CAST(:priority AS VARCHAR) IS NULL OR t.priority = CAST(:priority AS VARCHAR))
            AND (CAST(:assigneeId AS BIGINT) IS NULL OR ta.user_id = CAST(:assigneeId AS BIGINT))
            AND (CAST(:keyword AS VARCHAR) IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS VARCHAR), '%')))
            AND (CAST(:dueDateFrom AS TIMESTAMPTZ) IS NULL OR t.due_date >= CAST(:dueDateFrom AS TIMESTAMPTZ))
            AND (CAST(:dueDateTo AS TIMESTAMPTZ) IS NULL OR t.due_date <= CAST(:dueDateTo AS TIMESTAMPTZ))
          ORDER BY t.position ASC, t.id DESC
      """, nativeQuery = true)
  List<TaskEntity> searchTasks(
      @Param("projectId") Long projectId,
      @Param("status") String status,
      @Param("priority") String priority,
      @Param("assigneeId") Long assigneeId,
      @Param("keyword") String keyword,
      @Param("dueDateFrom") OffsetDateTime dueDateFrom,
      @Param("dueDateTo") OffsetDateTime dueDateTo,
      Pageable pageable);
}
