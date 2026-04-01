package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMemberEntity, Long> {

    @Query(value = """
            SELECT *
                FROM workspace_members wm
                WHERE wm.workspace_id = :workspaceId
                AND wm.user_id = :userId
            """, nativeQuery = true)
    Optional<WorkspaceMemberEntity> findByWorkspaceIdAndUserIdIgnoreRestriction(Long workspaceId, Long userId);

    Optional<WorkspaceMemberEntity> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);

    Page<WorkspaceMemberEntity> findByWorkspaceId(Long workspaceId, Pageable pageable);

    List<WorkspaceMemberEntity> findByWorkspaceIdAndUserIdIn(Long workspaceId, List<Long> userIds);

    long countByWorkspaceIdAndRole(Long workspaceId, WorkspaceRole workspaceRole);

    List<WorkspaceMemberEntity> findByWorkspaceIdAndRoleIn(Long workspaceId, List<WorkspaceRole> roles);

    Optional<WorkspaceMemberEntity> findByIdAndWorkspaceId(Long memberId, Long workspaceId);

    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);

    @Modifying
    @Query("UPDATE WorkspaceMemberEntity wm SET wm.deletedAt = :now WHERE wm.workspace.id = :workspaceId AND wm.deletedAt IS NULL")
    int softDeleteByWorkspaceId(@Param("workspaceId") Long workspaceId, @Param("now") OffsetDateTime now);
}
