package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.WorkflowCommentMentionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface WorkflowCommentMentionRepository extends JpaRepository<WorkflowCommentMentionEntity, Long> {

    List<WorkflowCommentMentionEntity> findByCommentIdIn(List<Long> commentIds);

    void deleteByCommentId(Long commentId);

    @Query("""
    SELECT m.user.id
    FROM WorkflowCommentMentionEntity m
    WHERE m.comment.id = :commentId
""")
    Set<Long> findUserIdsByCommentId(Long commentId);
}
