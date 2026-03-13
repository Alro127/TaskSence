package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateSprintRequest {

    @NotNull(message = "Project id cannot be null")
    private Long projectId;

    @NotBlank(message = "Sprint name cannot be blank")
    private String name;

    private String goal;

    @NotNull(message = "Start date cannot be null")
    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    @NotNull(message = "End date cannot be null")
    @FutureOrPresent(message = "End date must be today or in the future")
    private LocalDate endDate;
}