package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.ProjectGuidanceProgressEntity;

import java.util.Optional;

@Repository
public interface ProjectGuidanceProgressRepository extends JpaRepository<ProjectGuidanceProgressEntity, Long> {
    Optional<ProjectGuidanceProgressEntity> findByProjectId(Long projectId);
}
