package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

    List<TaskEntity> findByProjectId(Long projectId);

    List<TaskEntity> findByProjectIdAndStatus(Long projectId, TaskStatus status);

    List<TaskEntity> findByParentTaskId(Long parentTaskId);

    Optional<TaskEntity> findByIdAndProjectId(Long id, Long projectId);

    @Query("""
                SELECT t FROM TaskEntity t
                WHERE t.project.id = :projectId
                  AND (:cursor IS NULL OR t.id < :cursor)
                  AND (:status IS NULL OR t.status = :status)
                  AND (:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
                ORDER BY t.position ASC, t.id DESC
            """)
    // Khả năng là cần thêm check deleted_at
    List<TaskEntity> searchTasks(
            @Param("projectId") Long projectId,
            @Param("status") TaskStatus status,
            @Param("keyword") String keyword,
            @Param("cursor") Long cursor,
            Pageable pageable);
}
