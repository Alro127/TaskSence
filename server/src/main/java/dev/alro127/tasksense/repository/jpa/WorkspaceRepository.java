package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import org.jspecify.annotations.NullMarked;
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

}
