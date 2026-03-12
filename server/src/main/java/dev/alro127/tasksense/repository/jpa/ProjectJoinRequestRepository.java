package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.ProjectJoinRequestEntity;
import dev.alro127.tasksense.domain.enums.JoinRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectJoinRequestRepository extends JpaRepository<ProjectJoinRequestEntity, Long> {

    Optional<ProjectJoinRequestEntity> findByProjectIdAndUserId(Long projectId, Long userId);

    List<ProjectJoinRequestEntity> findAllByProjectId(Long projectId);

    Page<ProjectJoinRequestEntity> findAllByProjectIdAndStatus(Long projectId, JoinRequestStatus status,
            Pageable pageable);

    List<ProjectJoinRequestEntity> findAllByUserId(Long userId);

    boolean existsByProjectIdAndUserIdAndStatus(Long projectId, Long userId, JoinRequestStatus status);
}
