package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.ProjectGuidanceTargetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectGuidanceTargetRepository extends JpaRepository<ProjectGuidanceTargetEntity, Long> {
    List<ProjectGuidanceTargetEntity> findAllByProgressId(Long progressId);
    List<ProjectGuidanceTargetEntity> findAllByProgressIdAndTargetTypeAndIsCompletedFalse(Long progressId, String targetType);
}
