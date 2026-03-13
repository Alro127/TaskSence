package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.UserSkillEntity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSkillRepository extends JpaRepository<UserSkillEntity, Long> {

    Page<UserSkillEntity> findByUserId(Long userId, Pageable pageable);
}
