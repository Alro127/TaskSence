package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.alro127.tasksense.domain.entity.TagEntity;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<TagEntity, Long> {

    List<TagEntity> findByProjectId(Long projectId);

    List<TagEntity> findAllByIdInAndProjectId(List<Long> ids, Long projectId);

    boolean existsByProjectIdAndName(Long projectId, String name);
}