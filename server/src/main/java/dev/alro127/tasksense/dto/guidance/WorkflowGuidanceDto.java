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
public class WorkflowGuidanceDto {
    private GuidanceSummaryDto summary;
    private List<GuidanceStepDto> interactiveSteps;
}
