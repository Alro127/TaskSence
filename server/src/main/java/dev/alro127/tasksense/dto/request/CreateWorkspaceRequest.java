package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateWorkspaceRequest {

    @NotBlank(message = "Workspace name is required")
    @Size(max = 255, message = "Workspace name must not exceed 255 characters")
    private String name;

    @Size(max = 2000, message = "Workspace description must not exceed 2000 characters")
    private String description;

    private Boolean isPublic;
}
