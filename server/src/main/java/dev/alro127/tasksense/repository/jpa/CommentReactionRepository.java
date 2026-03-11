package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.CommentReactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentReactionRepository extends JpaRepository<CommentReactionEntity, Long> {

    List<CommentReactionEntity> findByCommentIdIn(List<Long> commentIds);

    Optional<CommentReactionEntity> findByCommentIdAndUserIdAndIcon(
            Long commentId,
            Long userId,
            String icon
    );

    void deleteByCommentIdAndUserIdAndIcon(
            Long commentId,
            Long userId,
            String icon
    );
}