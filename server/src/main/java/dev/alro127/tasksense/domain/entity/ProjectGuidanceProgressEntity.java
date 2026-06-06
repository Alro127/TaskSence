package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "project_guidance_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectGuidanceProgressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private ProjectEntity project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_guidance_id", nullable = false)
    private WorkflowGuidanceEntity workflowGuidance;

    @Column(name = "current_step_id")
    private String currentStepId;

    @ElementCollection
    @CollectionTable(name = "project_guidance_completed_steps", joinColumns = @JoinColumn(name = "progress_id"))
    @Column(name = "step_id")
    @Builder.Default
    private Set<String> completedStepIds = new HashSet<>();

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private OffsetDateTime startedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
