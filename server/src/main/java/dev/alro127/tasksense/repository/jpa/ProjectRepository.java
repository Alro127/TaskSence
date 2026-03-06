package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.enums.ProjectStatus;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    @NullMarked
    Optional<ProjectEntity> findById(Long id);

    List<ProjectEntity> findAllByWorkspaceId(Long workspaceId);

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
}
