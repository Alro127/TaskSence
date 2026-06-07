package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import dev.alro127.tasksense.domain.enums.InviteStatus;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;

import org.hibernate.annotations.SQLRestriction;

import java.time.OffsetDateTime;

@Entity
@Table(name = "workspace_invites")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public class WorkspaceInviteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private WorkspaceEntity workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by", nullable = false)
    private UserEntity invitedBy;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 100)
    @Enumerated(EnumType.STRING)
    private WorkspaceRole role;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private InviteStatus status;

    @Column(nullable = false)
    private OffsetDateTime expiredAt;

    private OffsetDateTime acceptedAt;

    private OffsetDateTime invitedAt;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    private OffsetDateTime deletedAt;
}
