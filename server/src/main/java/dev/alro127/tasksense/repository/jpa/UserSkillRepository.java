package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.UserSkillEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSkillRepository extends JpaRepository<UserSkillEntity, Long> {

    List<UserSkillEntity> findByUserId(Long userId);
}
