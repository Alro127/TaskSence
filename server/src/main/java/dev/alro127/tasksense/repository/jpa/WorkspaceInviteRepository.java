package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceInviteEntity;
import dev.alro127.tasksense.domain.enums.InviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceInviteRepository extends JpaRepository<WorkspaceInviteEntity, Long> {
    Optional<WorkspaceInviteEntity> findByToken(String token);

    boolean existsByWorkspaceIdAndEmailAndStatus(Long workspaceId, String email, InviteStatus inviteStatus);

    List<WorkspaceInviteEntity> findByWorkspaceId(Long workspaceId);
}
