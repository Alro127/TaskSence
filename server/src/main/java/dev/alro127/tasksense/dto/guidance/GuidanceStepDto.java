package dev.alro127.tasksense.dto.guidance;

import dev.alro127.tasksense.domain.enums.GuidanceCapability;
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
    private GuidanceCapability action;
    private GuidanceCapability uiTarget;
    private StepType type;
    private List<String> dependsOn;
    private StepCompletionConditionDto completionCondition;
}
