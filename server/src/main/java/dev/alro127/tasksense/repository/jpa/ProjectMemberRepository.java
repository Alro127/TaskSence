package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

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
    List<ProjectMemberEntity> findAllByProjectId(Long projectId);

    Optional<ProjectMemberEntity> findByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserIdAndRole(Long projectId, Long userId, ProjectMemberRole role);

    @Query("""
                SELECT COUNT(m.id)
                FROM ProjectMemberEntity m
                WHERE m.project.id = :projectId
            """)
    Long countByProjectId(Long projectId);

    void deleteByProjectIdAndUserId(Long projectId, Long userId);

    @Query("""
                DELETE FROM ProjectMemberEntity pm
                WHERE pm.user.id = :userId
                  AND pm.project.workspace.id = :workspaceId
            """)
    void deleteByWorkspaceIdAndUserId(Long workspaceId, Long userId);
}
