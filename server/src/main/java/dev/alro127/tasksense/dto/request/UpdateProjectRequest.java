package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

import dev.alro127.tasksense.domain.enums.ProjectStatus;

@Data
public class UpdateProjectRequest {

    @Size(min = 1, max = 255, message = "Project name must be between 1 and 255 characters")
    private String name;

    @Size(max = 2000, message = "Project description must not exceed 2000 characters")
    private String description;

    private ProjectStatus status;

    private LocalDate startDate;

    private LocalDate endDate;
}
