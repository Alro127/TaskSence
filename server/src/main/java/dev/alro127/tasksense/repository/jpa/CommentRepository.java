package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<CommentEntity, Long> {
}
