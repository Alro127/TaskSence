package dev.alro127.tasksense.repository.jpa;

import dev.alro127.tasksense.domain.entity.TeamMemberTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TeamMemberTemplateRepository
        extends JpaRepository<TeamMemberTemplateEntity, Long> {

    List<TeamMemberTemplateEntity> findByTeamTemplateId(Long templateId);

    Optional<TeamMemberTemplateEntity>
    findByTeamTemplateIdAndUserId(Long templateId, Long userId);

    // Query bỏ restriction để check cả deleted
    @Query("""
       SELECT t FROM TeamMemberTemplateEntity t
       WHERE t.teamTemplate.id = :templateId
       AND t.user.id IN :userIds
       """)
    List<TeamMemberTemplateEntity>
    findAllByTemplateIdAndUserIdsIgnoreRestriction(Long templateId, List<Long> userIds);
}