package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkflowCommentReactionEntity;

import java.util.List;
import java.util.Optional;

public interface WorkflowCommentReactionRepository extends JpaRepository<WorkflowCommentReactionEntity, Long> {

    List<WorkflowCommentReactionEntity> findByCommentIdIn(List<Long> commentIds);

    Optional<WorkflowCommentReactionEntity> findByCommentIdAndUserIdAndIcon(
            Long commentId,
            Long userId,
            String icon);

    Optional<WorkflowCommentReactionEntity> findByCommentIdAndUserId(Long commentId, Long userId);

    void deleteByCommentIdAndUserIdAndIcon(
            Long commentId,
            Long userId,
            String icon);

    @Query("""
                SELECT c.user
                FROM WorkflowCommentReactionEntity c
                WHERE c.icon = :icon
                AND c.comment.id = :commentId
            """)
    List<UserEntity> findUsersByCommentIdAndIcon(Long commentId, String icon);
}
