package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.dto.guidance.GuidanceSummaryDto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdateWorkflowGuidanceRequest {
    @NotNull
    private GuidanceSummaryDto summary;
    
    @NotNull
    private List<UpdateGuidanceStepRequest> interactiveSteps;

    @Data
    public static class UpdateGuidanceStepRequest {
        @NotNull
        private String id;
        @NotNull
        private String description;
    }
}
