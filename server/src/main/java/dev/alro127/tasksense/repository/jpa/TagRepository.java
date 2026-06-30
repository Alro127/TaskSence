package dev.alro127.tasksense.repository.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.alro127.tasksense.domain.entity.TagEntity;

public interface TagRepository extends JpaRepository<TagEntity, Long> {

    List<TagEntity> findByProjectId(Long projectId);

    List<TagEntity> findAllByIdInAndProjectId(List<Long> ids, Long projectId);

    boolean existsByProjectIdAndName(Long projectId, String name);

    @Query(value = "SELECT * FROM tags WHERE project_id = :projectId AND name = :name LIMIT 1", nativeQuery = true)
    Optional<TagEntity> findByNameIncludingDeleted(@Param("projectId") Long projectId, @Param("name") String name);
}