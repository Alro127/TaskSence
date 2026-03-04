package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository< WorkspaceMemberEntity, Long> {
    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long id);

    List<WorkspaceMemberEntity> findByWorkspaceId(Long workspaceId);

    long countByWorkspaceIdAndRole(Long workspaceId, WorkspaceRole workspaceRole);

    Optional<WorkspaceMemberEntity> findByIdAndWorkspaceId(Long memberId, Long workspaceId);
}
