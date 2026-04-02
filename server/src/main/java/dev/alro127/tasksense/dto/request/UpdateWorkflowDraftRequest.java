package dev.alro127.tasksense.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateWorkflowDraftRequest {

    @NotBlank(message = "Workflow name is required")
    @Size(max = 255, message = "Workflow name must not exceed 255 characters")
    private String name;

    private String description;

    @NotEmpty(message = "Workflow steps are required")
    @Valid
    private List<UpdateWorkflowStepRequest> steps;

    @Data
    public static class UpdateWorkflowStepRequest {

        private Long id;

        @NotBlank(message = "Step title is required")
        @Size(max = 255, message = "Step title must not exceed 255 characters")
        private String title;

        private String description;

        @NotNull(message = "Step position is required")
        private Integer position;

        private String sourceType;

        private Long sourceSprintId;

        @NotEmpty(message = "Step taskIds are required")
        private List<Long> taskIds;
    }
}
