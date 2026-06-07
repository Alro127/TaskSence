package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import dev.alro127.tasksense.domain.entity.TeamMemberTemplateEntity;

import java.util.List;
import java.util.Optional;

public interface TeamMemberTemplateRepository
                extends JpaRepository<TeamMemberTemplateEntity, Long> {

        @Query("""
                           SELECT t
                           FROM TeamMemberTemplateEntity t
                           JOIN FETCH t.user
                           WHERE t.teamTemplate.id = :templateId
                        """)
        Page<TeamMemberTemplateEntity> findByTeamTemplateId(Long templateId, Pageable pageable);

        Optional<TeamMemberTemplateEntity> findByTeamTemplateIdAndUserId(Long templateId, Long userId);

        @Query(value = """
                        SELECT *
                        FROM team_member_templates t
                        WHERE t.team_template_id = :templateId
                        AND t.user_id IN (:userIds)
                        """, nativeQuery = true)
        List<TeamMemberTemplateEntity> findAllByTemplateIdAndUserIdsIgnoreRestriction(Long templateId,
                        List<Long> userIds);

        @Query("""
                            SELECT m.teamTemplate.id, COUNT(m.id)
                            FROM TeamMemberTemplateEntity m
                            WHERE m.teamTemplate.id IN :templateIds
                            GROUP BY m.teamTemplate.id
                        """)
        List<Object[]> countMembersByTemplateIds(List<Long> templateIds);

        @Query("""
                            SELECT COUNT(m.id)
                            FROM TeamMemberTemplateEntity m
                            WHERE m.teamTemplate.id = :teamTemplateId
                        """)
        Long countByTeamTemplateId(Long teamTemplateId);
}