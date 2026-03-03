package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.TeamTemplateEntity;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamTemplateRepository extends JpaRepository<TeamTemplateEntity, Long> {

    List<TeamTemplateEntity> findByOwnerId(Long ownerId);

    @NullMarked
    Optional<TeamTemplateEntity> findById(Long id);
}