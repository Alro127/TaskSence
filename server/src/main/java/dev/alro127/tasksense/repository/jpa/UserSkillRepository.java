package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import dev.alro127.tasksense.domain.entity.UserSkillEntity;

public interface UserSkillRepository extends JpaRepository<UserSkillEntity, Long> {

    Page<UserSkillEntity> findByUserId(Long userId, Pageable pageable);
}
