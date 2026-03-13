package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.SprintEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SprintRepository extends JpaRepository<SprintEntity, Long> {

    Page<SprintEntity> findByProjectId(Long projectId, Pageable pageable);



}