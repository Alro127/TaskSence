package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateWorkspaceRequest {

    @Size(min = 1, max = 255, message = "Workspace name must be between 1 and 255 characters")
    private String name;

    @Size(max = 2000, message = "Workspace description must not exceed 2000 characters")
    private String description;
}
