package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.CommentMentionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentMentionRepository extends JpaRepository<CommentMentionEntity, Long> {

    List<CommentMentionEntity> findByCommentIdIn(List<Long> commentIds);

    List<CommentMentionEntity> findByUserId(Long userId);
}
