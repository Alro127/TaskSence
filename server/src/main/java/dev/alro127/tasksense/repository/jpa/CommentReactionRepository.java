package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.CommentReactionEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

    Optional<CommentReactionEntity> findByCommentIdAndUserId(Long commentId, Long id);

    @Query("""
    SELECT c.user
    FROM CommentReactionEntity c
    WHERE c.icon = :icon
    AND c.comment.id = :commentId
""")
    List<UserEntity> findUsersByCommentIdAndIcon(Long commentId, String icon);
}