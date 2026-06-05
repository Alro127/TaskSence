package dev.alro127.tasksense.domain.entity;

import dev.alro127.tasksense.dto.guidance.GuidanceSummaryDto;
import dev.alro127.tasksense.dto.guidance.WorkflowGuidanceDto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "workflow_guidance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowGuidanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id", nullable = false)
    private WorkflowEntity workflow;

    @Column(name = "publication_version", nullable = false)
    private Integer publicationVersion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_json", columnDefinition = "jsonb", nullable = false)
    private WorkflowGuidanceDto rawJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "summary_json", columnDefinition = "jsonb")
    private GuidanceSummaryDto summaryJson;

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private OffsetDateTime generatedAt;

    @Column(name = "is_user_edited", nullable = false)
    @Builder.Default
    private Boolean isUserEdited = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "edited_by")
    private UserEntity editedBy;
}
