package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.repository.projection.SprintTaskStats;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

    Page<TaskEntity> findByProjectId(Long projectId, Pageable pageable);

    List<TaskEntity> findAllByProjectIdOrderByPositionAscIdAsc(Long projectId);

    List<TaskEntity> findByProjectIdAndStatus(Long projectId, TaskStatus status);

    Page<TaskEntity> findByParentTaskId(Long parentTaskId, Pageable pageable);

    Optional<TaskEntity> findByIdAndProjectId(Long id, Long projectId);

    @Query("""
                SELECT DISTINCT t
                FROM TaskEntity t
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                JOIN FETCH t.createdBy
                LEFT JOIN FETCH t.assignees
                LEFT JOIN FETCH t.tags
                LEFT JOIN FETCH t.sprint
                WHERE p.id = :projectId
                  AND LOWER(t.title) = LOWER(:title)
                ORDER BY t.updatedAt DESC, t.id DESC
            """)
    List<TaskEntity> findByProjectIdAndTitleExact(@Param("projectId") Long projectId, @Param("title") String title, Pageable pageable);

    @Query("""
                SELECT DISTINCT t
                FROM TaskEntity t
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                JOIN FETCH t.createdBy
                LEFT JOIN FETCH t.assignees
                LEFT JOIN FETCH t.tags
                LEFT JOIN FETCH t.sprint
                WHERE p.id = :projectId
                  AND LOWER(t.title) LIKE LOWER(CONCAT('%', :title, '%'))
                ORDER BY t.updatedAt DESC, t.id DESC
            """)
    List<TaskEntity> findByProjectIdAndTitleLike(@Param("projectId") Long projectId, @Param("title") String title, Pageable pageable);

    List<TaskEntity> findAllByIdInAndProjectId(List<Long> ids, Long projectId);

    // Câu query bên dưới cần được optimize lại
    @Query(value = """
                            SELECT DISTINCT t.*
                            FROM tasks t
                            LEFT JOIN task_assignees ta ON t.id = ta.task_id
                            WHERE t.deleted_at IS NULL
                                    AND t.project_id = :projectId
                                    AND (CAST(:status AS VARCHAR) IS NULL OR t.status = CAST(:status AS VARCHAR))
                                    AND (CAST(:priority AS VARCHAR) IS NULL OR t.priority = CAST(:priority AS VARCHAR))
                                    AND (CAST(:assigneeId AS BIGINT) IS NULL OR ta.user_id = CAST(:assigneeId AS BIGINT))
                                    AND (CAST(:sprintId AS BIGINT) IS NULL OR t.sprint_id = CAST(:sprintId AS BIGINT))
                                    AND (CAST(:keyword AS VARCHAR) IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS VARCHAR), '%')))
                                    AND (CAST(:dueDateFrom AS TIMESTAMPTZ) IS NULL OR t.due_date >= CAST(:dueDateFrom AS TIMESTAMPTZ))
                                    AND (CAST(:dueDateTo AS TIMESTAMPTZ) IS NULL OR t.due_date <= CAST(:dueDateTo AS TIMESTAMPTZ))
                                    AND (:filterByTags = FALSE OR EXISTS (
                                                            SELECT 1
                                                            FROM task_tags tt
                                                            WHERE tt.task_id = t.id
                                                                    AND tt.tag_id IN (:tagIds)
                                    ))
                            ORDER BY t.position ASC, t.id DESC
            """, countQuery = """
                            SELECT COUNT(DISTINCT t.id)
                            FROM tasks t
                            LEFT JOIN task_assignees ta ON t.id = ta.task_id
                            WHERE t.deleted_at IS NULL
                                    AND t.project_id = :projectId
                                    AND (CAST(:status AS VARCHAR) IS NULL OR t.status = CAST(:status AS VARCHAR))
                                    AND (CAST(:priority AS VARCHAR) IS NULL OR t.priority = CAST(:priority AS VARCHAR))
                                    AND (CAST(:assigneeId AS BIGINT) IS NULL OR ta.user_id = CAST(:assigneeId AS BIGINT))
                                    AND (CAST(:sprintId AS BIGINT) IS NULL OR t.sprint_id = CAST(:sprintId AS BIGINT))
                                    AND (CAST(:keyword AS VARCHAR) IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS VARCHAR), '%')))
                                    AND (CAST(:dueDateFrom AS TIMESTAMPTZ) IS NULL OR t.due_date >= CAST(:dueDateFrom AS TIMESTAMPTZ))
                                    AND (CAST(:dueDateTo AS TIMESTAMPTZ) IS NULL OR t.due_date <= CAST(:dueDateTo AS TIMESTAMPTZ))
                                    AND (:filterByTags = FALSE OR EXISTS (
                                                            SELECT 1
                                                            FROM task_tags tt
                                                            WHERE tt.task_id = t.id
                                                                    AND tt.tag_id IN (:tagIds)
                                    ))
            """, nativeQuery = true)
    Page<TaskEntity> searchTasks(
            @Param("projectId") Long projectId,
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("assigneeId") Long assigneeId,
            @Param("sprintId") Long sprintId,
            @Param("filterByTags") boolean filterByTags,
            @Param("tagIds") List<Long> tagIds,
            @Param("keyword") String keyword,
            @Param("dueDateFrom") OffsetDateTime dueDateFrom,
            @Param("dueDateTo") OffsetDateTime dueDateTo,
            Pageable pageable);

    @Query("""
            SELECT t
            FROM TaskEntity t
            WHERE t.dueDate BETWEEN :now AND :window
            """)
    List<TaskEntity> findTasksWithReminderBetween(
            OffsetDateTime now,
            OffsetDateTime window);

    @Query("""
                SELECT DISTINCT t
                FROM TaskEntity t
                LEFT JOIN FETCH t.assignees
                LEFT JOIN FETCH t.project p
                LEFT JOIN FETCH p.workspace
                WHERE t.id = :id
            """)
    Optional<TaskEntity> findWithAssigneesProjectWorkspace(Long id);

    // ===== ES sync queries =====

    @Query("SELECT t.id FROM TaskEntity t WHERE t.updatedAt > :since ORDER BY t.id ASC")
    List<Long> findIdsSince(@Param("since") OffsetDateTime since, Pageable pageable);

    @Query("""
                SELECT DISTINCT t FROM TaskEntity t
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                JOIN FETCH t.createdBy
                LEFT JOIN FETCH t.assignees
                LEFT JOIN FETCH t.tags
                LEFT JOIN FETCH t.sprint
                WHERE t.id IN :ids
            """)
    List<TaskEntity> findAllByIdsWithAssociations(@Param("ids") List<Long> ids);

    @Query("""
                SELECT DISTINCT t FROM TaskEntity t
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                JOIN FETCH t.createdBy
                LEFT JOIN FETCH t.assignees
                LEFT JOIN FETCH t.tags
                LEFT JOIN FETCH t.sprint
                WHERE t.id = :id
            """)
    Optional<TaskEntity> findByIdWithAssociations(@Param("id") Long id);

    @Modifying
    @Query("UPDATE TaskEntity t SET t.deletedAt = :now WHERE t.project.id = :projectId AND t.deletedAt IS NULL")
    int softDeleteByProjectId(@Param("projectId") Long projectId, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("UPDATE TaskEntity t SET t.deletedAt = :now WHERE t.project.id IN :projectIds AND t.deletedAt IS NULL")
    int softDeleteByProjectIds(@Param("projectIds") List<Long> projectIds, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("UPDATE TaskEntity t SET t.deletedAt = :now WHERE t.parentTask.id = :parentTaskId AND t.deletedAt IS NULL")
    int softDeleteByParentTaskId(@Param("parentTaskId") Long parentTaskId, @Param("now") OffsetDateTime now);

    @Query(value = """
                SELECT
                    COUNT(*) as taskCount,
                    SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completedTaskCount
                FROM tasks
                WHERE sprint_id = :sprintId
            """, nativeQuery = true)
    SprintTaskStats getSprintTaskStats(Long sprintId);

    @Query("""
                SELECT t.sprint.id as sprintId,
                       COUNT(t) as taskCount,
                       SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as completedTaskCount
                FROM TaskEntity t
                WHERE t.sprint.id IN :sprintIds
                GROUP BY t.sprint.id
            """)
    List<SprintTaskStats> getSprintTaskStatsBySprintIds(List<Long> sprintIds);

    Long countByProjectId(Long id);

    Float countByProjectIdAndStatus(Long id, TaskStatus taskStatus);

    @Query("""
        SELECT t.project.id, COUNT(t.id)
        FROM TaskEntity t
        WHERE t.project.id IN :projectIds
        GROUP BY t.project.id
    """)
    List<Object[]> countByProjectIds(List<Long> projectIds);

    @Query("""
        SELECT t.project.id, COUNT(t.id)
        FROM TaskEntity t
        WHERE t.project.id IN :projectIds
        AND t.status = :status
        GROUP BY t.project.id
    """)
    List<Object[]> countDoneByProjectIds(List<Long> projectIds, TaskStatus status);

    // ===== Dashboard queries =====

    @Query("""
                SELECT DISTINCT t
                FROM TaskEntity t
                JOIN t.assignees a
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                WHERE a.id = :userId
                ORDER BY t.dueDate ASC NULLS LAST, t.createdAt DESC
            """)
    Page<TaskEntity> findAssignedToUser(@Param("userId") Long userId, Pageable pageable);

    @Query("""
                SELECT DISTINCT t
                FROM TaskEntity t
                JOIN t.assignees a
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                WHERE a.id = :userId
                  AND t.dueDate >= :startOfDay
                  AND t.dueDate < :endOfDay
                  AND t.status <> 'DONE'
                ORDER BY t.dueDate ASC
            """)
    Page<TaskEntity> findAssignedToUserDueToday(@Param("userId") Long userId,
            @Param("startOfDay") OffsetDateTime startOfDay,
            @Param("endOfDay") OffsetDateTime endOfDay,
            Pageable pageable);

    @Query("""
                SELECT DISTINCT t
                FROM TaskEntity t
                JOIN t.assignees a
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                WHERE a.id = :userId
                  AND t.dueDate < :now
                  AND t.status <> 'DONE'
                ORDER BY t.dueDate ASC
            """)
    Page<TaskEntity> findAssignedToUserOverdue(@Param("userId") Long userId,
            @Param("now") OffsetDateTime now,
            Pageable pageable);

    @Query("""
                SELECT COUNT(DISTINCT t)
                FROM TaskEntity t
                JOIN t.assignees a
                WHERE a.id = :userId
            """)
    long countAssignedToUser(@Param("userId") Long userId);

    @Query("""
                SELECT COUNT(DISTINCT t)
                FROM TaskEntity t
                JOIN t.assignees a
                WHERE a.id = :userId
                  AND t.status = 'DONE'
            """)
    long countCompletedAssignedToUser(@Param("userId") Long userId);

    @Query("""
                SELECT COUNT(DISTINCT t)
                FROM TaskEntity t
                JOIN t.assignees a
                WHERE a.id = :userId
                  AND t.dueDate < :now
                  AND t.status <> 'DONE'
            """)
    long countOverdueAssignedToUser(@Param("userId") Long userId, @Param("now") OffsetDateTime now);

    @Query("""
                SELECT t.project.id, COUNT(t.id)
                FROM TaskEntity t
                WHERE t.project.id IN :projectIds
                  AND t.dueDate < :now
                  AND t.status <> 'DONE'
                GROUP BY t.project.id
            """)
    List<Object[]> countOverdueByProjectIds(@Param("projectIds") List<Long> projectIds,
            @Param("now") OffsetDateTime now);

    @Query("""
                SELECT DISTINCT t
                FROM TaskEntity t
                JOIN t.assignees a
                JOIN FETCH t.project p
                JOIN FETCH p.workspace
                WHERE a.id = :userId
                  AND t.dueDate >= :startDate
                  AND t.dueDate <= :endDate
                  AND t.status <> 'DONE'
                ORDER BY t.dueDate ASC
            """)
    List<TaskEntity> findUpcomingAssignedToUser(@Param("userId") Long userId,
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate);
}
