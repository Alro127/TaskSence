package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceInviteEntity;
import dev.alro127.tasksense.domain.enums.InviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkspaceInviteRepository extends JpaRepository<WorkspaceInviteEntity, Long> {
    Optional<WorkspaceInviteEntity> findByToken(String token);

    boolean existsByWorkspaceIdAndEmailAndStatus(Long workspaceId, String email, InviteStatus inviteStatus);

    List<WorkspaceInviteEntity> findByWorkspaceId(Long workspaceId);

    @Modifying
    @Query("UPDATE WorkspaceInviteEntity wi SET wi.deletedAt = :now WHERE wi.workspace.id = :workspaceId AND wi.deletedAt IS NULL")
    int softDeleteByWorkspaceId(@Param("workspaceId") Long workspaceId, @Param("now") OffsetDateTime now);
}
