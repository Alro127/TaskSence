package dev.alro127.tasksense.repository.jpa;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.domain.enums.ProjectStatus;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    @NullMarked
    Optional<ProjectEntity> findById(Long id);

    Page<ProjectEntity> findAllByWorkspaceId(Long workspaceId, Pageable pageable);

    @Query("""
               SELECT p
               FROM ProjectEntity p
               JOIN FETCH p.workspace
               JOIN ProjectMemberEntity pm ON pm.project = p
               WHERE p.workspace.id = :workspaceId
               AND pm.user.id = :userId
               AND pm.deletedAt IS NULL
            """)
    List<ProjectEntity> findAllByWorkspaceIdAndMemberId(Long workspaceId, Long userId);

    List<ProjectEntity> findAllByWorkspaceIdAndStatus(Long workspaceId, ProjectStatus status);

    boolean existsByIdAndWorkspaceId(Long id, Long workspaceId);

    boolean existsById(Long id);

    @Query("SELECT p.id FROM ProjectEntity p WHERE p.workspace.id = :workspaceId")
    List<Long> findIdsByWorkspaceId(@Param("workspaceId") Long workspaceId);

    @Modifying
    @Query("UPDATE ProjectEntity p SET p.deletedAt = :now WHERE p.workspace.id = :workspaceId AND p.deletedAt IS NULL")
    int softDeleteByWorkspaceId(@Param("workspaceId") Long workspaceId, @Param("now") OffsetDateTime now);

    // ===== ES sync queries =====

    @Query("SELECT p.id FROM ProjectEntity p WHERE p.updatedAt > :since ORDER BY p.id ASC")
    List<Long> findIdsSince(@Param("since") OffsetDateTime since, Pageable pageable);

    @Query("SELECT p FROM ProjectEntity p JOIN FETCH p.workspace WHERE p.id IN :ids")
    List<ProjectEntity> findAllByIdsWithWorkspace(@Param("ids") List<Long> ids);

    @Query("SELECT p FROM ProjectEntity p JOIN FETCH p.workspace WHERE p.id = :id")
    Optional<ProjectEntity> findByIdWithWorkspace(@Param("id") Long id);

    Long countByWorkspaceId(@Param("id") Long id);

    @Query("""
                SELECT p.workspace.id, COUNT(p.id)
                FROM ProjectEntity p
                WHERE p.workspace.id IN :workspaceIds
                GROUP BY p.workspace.id
            """)
    List<Object[]> countByWorkspaceIds(@Param("workspaceIds") List<Long> workspaceIds);

    @Query("""
                SELECT DISTINCT p
                FROM ProjectEntity p
                JOIN FETCH p.workspace w
                WHERE (CAST(:projectName AS string) IS NULL OR LOWER(p.name) = LOWER(CAST(:projectName AS string)))
                AND (:workspaceId IS NULL OR w.id = :workspaceId)
                AND (CAST(:workspaceName AS string) IS NULL OR LOWER(w.name) = LOWER(CAST(:workspaceName AS string)))
                AND (
                    EXISTS (
                        SELECT 1 FROM ProjectMemberEntity pm
                        WHERE pm.project = p
                        AND pm.user.id = :userId
                        AND pm.role IN :allowedProjectRoles
                    )
                    OR EXISTS (
                        SELECT 1 FROM WorkspaceMemberEntity wm
                        WHERE wm.workspace = w
                        AND wm.user.id = :userId
                        AND wm.role IN :allowedInheritedWorkspaceRoles
                    )
                )
                ORDER BY p.updatedAt DESC, p.id DESC
            """)
    List<ProjectEntity> findAuthorizedExactName(
            @Param("userId") Long userId,
            @Param("projectName") String projectName,
            @Param("workspaceId") Long workspaceId,
            @Param("workspaceName") String workspaceName,
            @Param("allowedProjectRoles") Collection<ProjectMemberRole> allowedProjectRoles,
            @Param("allowedInheritedWorkspaceRoles") Collection<WorkspaceRole> allowedInheritedWorkspaceRoles,
            Pageable pageable);

    @Query("""
                SELECT DISTINCT p
                FROM ProjectEntity p
                JOIN FETCH p.workspace w
                WHERE (CAST(:projectName AS string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:projectName AS string), '%')))
                AND (:workspaceId IS NULL OR w.id = :workspaceId)
                AND (CAST(:workspaceName AS string) IS NULL OR LOWER(w.name) LIKE LOWER(CONCAT('%', CAST(:workspaceName AS string), '%')))
                AND (
                    EXISTS (
                        SELECT 1 FROM ProjectMemberEntity pm
                        WHERE pm.project = p
                        AND pm.user.id = :userId
                        AND pm.role IN :allowedProjectRoles
                    )
                    OR EXISTS (
                        SELECT 1 FROM WorkspaceMemberEntity wm
                        WHERE wm.workspace = w
                        AND wm.user.id = :userId
                        AND wm.role IN :allowedInheritedWorkspaceRoles
                    )
                )
                ORDER BY p.updatedAt DESC, p.id DESC
            """)
    List<ProjectEntity> findAuthorizedNameLike(
            @Param("userId") Long userId,
            @Param("projectName") String projectName,
            @Param("workspaceId") Long workspaceId,
            @Param("workspaceName") String workspaceName,
            @Param("allowedProjectRoles") Collection<ProjectMemberRole> allowedProjectRoles,
            @Param("allowedInheritedWorkspaceRoles") Collection<WorkspaceRole> allowedInheritedWorkspaceRoles,
            Pageable pageable);

    List<ProjectEntity> findAllBySourceWorkflowId(Long sourceWorkflowId);

    @Modifying
    @Query("UPDATE ProjectEntity p SET p.sourceWorkflow = NULL WHERE p.sourceWorkflow.id IN :workflowIds")
    void setSourceWorkflowToNullByWorkflowIds(@Param("workflowIds") List<Long> workflowIds);
}
