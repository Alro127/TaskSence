package dev.alro127.tasksense.dto.guidance;

import dev.alro127.tasksense.domain.enums.GuidanceConditionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StepCompletionConditionDto {
    private GuidanceConditionType type;
    private Integer count;
}
