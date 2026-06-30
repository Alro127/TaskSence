package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "team_member_templates", uniqueConstraints = {
                @UniqueConstraint(name = "uk_team_template_user", columnNames = { "team_template_id", "user_id" })
})
@SQLRestriction("deleted_at IS NULL")
public class TeamMemberTemplateEntity {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "team_template_id", nullable = false, foreignKey = @ForeignKey(name = "fk_member_template_team_template"))
        private TeamTemplateEntity teamTemplate;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_member_template_user"))
        private UserEntity user;

        @CreationTimestamp
        @Column(name = "created_at", updatable = false)
        private OffsetDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private OffsetDateTime updatedAt;

        @Column(name = "deleted_at")
        private OffsetDateTime deletedAt;
}