package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "project_guidance_target")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectGuidanceTargetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "progress_id", nullable = false)
    private ProjectGuidanceProgressEntity progress;

    @Column(name = "step_id", nullable = false)
    private String stepId;

    @Column(name = "target_type", nullable = false)
    private String targetType; // e.g., TASK_CREATED, SPRINT_CREATED, TASK_STATUS_UPDATED

    @Column(name = "required_count", nullable = false)
    @Builder.Default
    private Integer requiredCount = 1;

    @Column(name = "current_count", nullable = false)
    @Builder.Default
    private Integer currentCount = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_metadata", columnDefinition = "jsonb")
    private Map<String, Object> targetMetadata;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;
}
