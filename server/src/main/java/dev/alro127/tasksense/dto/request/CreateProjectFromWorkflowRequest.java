package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectFromWorkflowRequest {
    @NotBlank(message = "Project name is required")
    private String name;
    
    private String description;
    
    private Long workspaceId; // If provided, use it. Else create new.
}
