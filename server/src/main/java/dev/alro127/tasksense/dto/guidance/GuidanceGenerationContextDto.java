package dev.alro127.tasksense.dto.guidance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuidanceGenerationContextDto {
    private Long workflowId;
    private String name;
    private String description;
    private String projectName;
    private List<WorkflowStepContextDto> steps;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkflowStepContextDto {
        private String title;
        private String description;
        private Integer position;
    }
}
