package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceJoinRequestEntity;
import dev.alro127.tasksense.domain.enums.JoinRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface WorkspaceJoinRequestRepository
        extends JpaRepository<WorkspaceJoinRequestEntity, Long> {

    boolean existsByWorkspaceIdAndUserIdAndStatus(
            Long workspaceId,
            Long userId,
            JoinRequestStatus status
    );

    @Query("""
        SELECT jr
        FROM WorkspaceJoinRequestEntity jr
        JOIN FETCH jr.user
        JOIN FETCH jr.workspace
        LEFT JOIN FETCH jr.reviewedBy
        WHERE jr.workspace.id = :workspaceId
    """)
    List<WorkspaceJoinRequestEntity> findByWorkspaceId(Long workspaceId);

    @Query("""
        SELECT jr
        FROM WorkspaceJoinRequestEntity jr
        JOIN FETCH jr.user
        JOIN FETCH jr.workspace
        LEFT JOIN FETCH jr.reviewedBy
        WHERE jr.id = :id
    """)
    Optional<WorkspaceJoinRequestEntity> findWithDetailsById(Long id);

}