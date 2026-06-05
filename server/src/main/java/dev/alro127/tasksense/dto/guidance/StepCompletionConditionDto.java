package dev.alro127.tasksense.dto.guidance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StepCompletionConditionDto {
    private String type; // e.g., TASK_CREATED, MANUAL
    private Integer count;
}
