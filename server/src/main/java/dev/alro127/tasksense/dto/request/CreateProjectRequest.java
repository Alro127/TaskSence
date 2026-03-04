package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(max = 255, message = "Project name must not exceed 255 characters")
    private String name;

    @Size(max = 2000, message = "Project description must not exceed 2000 characters")
    private String description;

    private ProjectStatus status;

    private LocalDate startDate;

    private LocalDate endDate;
}
