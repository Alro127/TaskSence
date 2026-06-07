package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import dev.alro127.tasksense.domain.enums.WorkspaceRole;

import java.time.OffsetDateTime;

@Entity
@Table(name = "workspace_members", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "workspace_id", "user_id" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public class WorkspaceMemberEntity {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "workspace_id", nullable = false)
        private WorkspaceEntity workspace;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "user_id", nullable = false)
        private UserEntity user;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 100)
        private WorkspaceRole role;

        @Column(name = "joined_at")
        private OffsetDateTime joinedAt;

        @CreationTimestamp
        @Column(name = "created_at", updatable = false)
        private OffsetDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private OffsetDateTime updatedAt;

        @Column(name = "deleted_at")
        private OffsetDateTime deletedAt;
}