package dev.alro127.tasksense.domain.entity;

import dev.alro127.tasksense.domain.enums.WorkflowGenerationSource;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "workflows")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectEntity project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkflowStatus status = WorkflowStatus.DRAFT;

    @Column(name = "generation_source", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkflowGenerationSource generationSource = WorkflowGenerationSource.RULE_BASED;

    @Column(name = "ai_refinement_requested", nullable = false)
    @Builder.Default
    private Boolean aiRefinementRequested = false;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "publication_version", nullable = false)
    @Builder.Default
    private Integer publicationVersion = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
