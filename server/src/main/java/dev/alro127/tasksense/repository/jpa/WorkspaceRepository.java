package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<WorkspaceEntity, Long> {

    Optional<WorkspaceEntity> findByIdAndDeletedAtIsNull(Long id);

    List<WorkspaceEntity> findAllByOwnerIdAndDeletedAtIsNull(Long ownerId);

    boolean existsByIdAndDeletedAtIsNull(Long id);

    List<WorkspaceEntity> findAllByDeletedAtIsNull();
}
