package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;

import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMemberEntity, Long> {

    @Query("""
                SELECT m
                FROM ProjectMemberEntity m
                JOIN FETCH m.user
                WHERE m.project.id = :projectId
            """)
    Page<ProjectMemberEntity> findAllByProjectId(Long projectId, Pageable pageable);

    @Query("""
                SELECT m
                FROM ProjectMemberEntity m
                JOIN FETCH m.user
                WHERE m.project.id = :projectId
            """)
    List<ProjectMemberEntity> findAllByProjectId(Long projectId);

    List<ProjectMemberEntity> findByProjectIdAndUserIdIn(Long projectId, List<Long> userIds);

    Optional<ProjectMemberEntity> findByProjectIdAndUserId(Long projectId, Long userId);

    Optional<ProjectMemberEntity> findByProjectIdAndRole(Long projectId, ProjectMemberRole role);

    long countByProjectIdAndRole(Long projectId, ProjectMemberRole role);

    List<ProjectMemberEntity> findAllByProjectIdAndRole(Long projectId, ProjectMemberRole role);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserIdAndRole(Long projectId, Long userId, ProjectMemberRole role);

    @Query("""
                SELECT COUNT(m.id)
                FROM ProjectMemberEntity m
                WHERE m.project.id = :projectId
            """)
    Long countByProjectId(Long projectId);

    void deleteByProjectIdAndUserId(Long projectId, Long userId);

    @Modifying
    @Query("""
                DELETE FROM ProjectMemberEntity pm
                WHERE pm.user.id = :userId
                  AND pm.project.workspace.id = :workspaceId
            """)
    void deleteByWorkspaceIdAndUserId(Long workspaceId, Long userId);

    @Query(value = """
            SELECT * FROM project_members pm
            WHERE pm.project_id = :projectId AND pm.user_id = :userId
            """, nativeQuery = true)
    Optional<ProjectMemberEntity> findByProjectIdAndUserIdIgnoreRestriction(
            @Param("projectId") Long projectId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ProjectMemberEntity pm SET pm.deletedAt = :now WHERE pm.project.id IN :projectIds AND pm.deletedAt IS NULL")
    int softDeleteByProjectIds(@Param("projectIds") List<Long> projectIds, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("UPDATE ProjectMemberEntity pm SET pm.deletedAt = :now WHERE pm.project.id = :projectId AND pm.deletedAt IS NULL")
    int softDeleteByProjectId(@Param("projectId") Long projectId, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("""
                UPDATE ProjectMemberEntity pm
                SET pm.deletedAt = :now
                WHERE pm.user.id = :userId
                  AND pm.project.workspace.id = :workspaceId
                  AND pm.deletedAt IS NULL
            """)
    void softDeleteByWorkspaceIdAndUserId(Long workspaceId, Long userId, OffsetDateTime now);

    // ===== Dashboard queries =====

    @Query("""
                SELECT p
                FROM ProjectMemberEntity pm
                JOIN pm.project p
                JOIN FETCH p.workspace
                WHERE pm.user.id = :userId
                ORDER BY p.updatedAt DESC
            """)
    List<ProjectEntity> findProjectsByUserId(@Param("userId") Long userId);

    @Query("""
                SELECT pm.project.id, COUNT(pm.id)
                FROM ProjectMemberEntity pm
                WHERE pm.project.id IN :projectIds
                GROUP BY pm.project.id
            """)
    List<Object[]> countMembersByProjectIds(@Param("projectIds") List<Long> projectIds);

}
