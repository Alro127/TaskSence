package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.enums.WorkflowGenerationSource;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class WorkflowDraftResponse {

    private Long id;

    private Long projectId;

    private Long createdBy;

    private String name;

    private String description;

    private WorkflowStatus status;

    private WorkflowGenerationSource generationSource;

    private Boolean aiRefinementRequested;

    private OffsetDateTime publishedAt;

    private Integer publicationVersion;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    private boolean favorited;

    private List<WorkflowStepResponse> steps;
}
