package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamTemplateRequest {

    @NotBlank(message = "Template name must not be blank")
    @Size(max = 255, message = "Template name must not exceed 255 characters")
    private String name;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;
}
