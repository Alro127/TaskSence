package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.CommentMentionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface CommentMentionRepository extends JpaRepository<CommentMentionEntity, Long> {

    List<CommentMentionEntity> findByCommentIdIn(List<Long> commentIds);

    List<CommentMentionEntity> findByUserId(Long userId);

    void deleteByCommentId(Long commentId);

    @Query("""
    SELECT m.user.id
    FROM CommentMentionEntity m
    WHERE m.comment.id = :commentId
""")
    Set<Long> findUserIdsByCommentId(Long commentId);
}
