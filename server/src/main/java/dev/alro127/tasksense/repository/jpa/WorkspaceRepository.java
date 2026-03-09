package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import io.lettuce.core.dynamic.annotation.Param;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<WorkspaceEntity, Long> {

    @NullMarked
    Optional<WorkspaceEntity> findById(Long id);

    List<WorkspaceEntity> findAllByOwnerId(Long ownerId);

    @Query("""
       SELECT DISTINCT w
       FROM WorkspaceEntity w
       JOIN WorkspaceMemberEntity wm ON wm.workspace = w
       WHERE wm.user.id = :userId
       """)
    List<WorkspaceEntity> findAllByMemberUserId(Long userId);

    boolean existsById(Long id);

    @Query("""
        SELECT w
        FROM WorkspaceEntity w
        JOIN FETCH w.owner
        WHERE LOWER(w.name) LIKE LOWER(CONCAT('%', :name, '%'))
        AND w.isPublic = true
        AND (:cursor IS NULL OR w.id < :cursor)
        ORDER BY w.id DESC
    """)
    List<WorkspaceEntity> searchWorkspaces(
            @Param("name") String name,
            @Param("cursor") Long cursor,
            Pageable pageable
    );

    @Query("""
        SELECT w
        FROM WorkspaceEntity w
        JOIN FETCH w.owner
        WHERE w.owner.id = :userId
        AND w.isPublic = true
    """)
    List<WorkspaceEntity> findPublicWorkspacesByOwner(@Param("userId") Long userId);
}
