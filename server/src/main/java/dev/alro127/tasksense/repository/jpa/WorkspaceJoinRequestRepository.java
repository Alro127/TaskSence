package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import dev.alro127.tasksense.domain.entity.WorkspaceJoinRequestEntity;
import dev.alro127.tasksense.domain.enums.JoinRequestStatus;

import java.util.List;
import java.util.Optional;

public interface WorkspaceJoinRequestRepository
        extends JpaRepository<WorkspaceJoinRequestEntity, Long> {

    boolean existsByWorkspaceIdAndUserIdAndStatus(
            Long workspaceId,
            Long userId,
            JoinRequestStatus status);

    @Query(value = """
                SELECT jr
                FROM WorkspaceJoinRequestEntity jr
                JOIN FETCH jr.user
                JOIN FETCH jr.workspace
                LEFT JOIN FETCH jr.reviewedBy
                WHERE jr.workspace.id = :workspaceId
            """, countQuery = "SELECT COUNT(jr) FROM WorkspaceJoinRequestEntity jr WHERE jr.workspace.id = :workspaceId")
    Page<WorkspaceJoinRequestEntity> findByWorkspaceId(Long workspaceId, Pageable pageable);

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