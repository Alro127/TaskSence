package dev.alro127.tasksense.repository.jpa;

import org.jspecify.annotations.NullMarked;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import dev.alro127.tasksense.domain.entity.TeamTemplateEntity;

import java.util.Optional;

public interface TeamTemplateRepository extends JpaRepository<TeamTemplateEntity, Long> {

    Page<TeamTemplateEntity> findByOwnerId(Long ownerId, Pageable pageable);

    @NullMarked
    Optional<TeamTemplateEntity> findById(Long id);
}