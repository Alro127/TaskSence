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
public class GuidanceStepDto {
    private String id;
    private String title;
    private String description;
    private String action;
    private String uiTarget;
    private StepType type;
    private List<String> dependsOn;
    private StepCompletionConditionDto completionCondition;
}
