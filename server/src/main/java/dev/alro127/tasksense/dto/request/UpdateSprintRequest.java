package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.FutureOrPresent;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateSprintRequest {

    @NotBlank(message = "Sprint name cannot be blank")
    private String name;

    private String goal;

    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    @FutureOrPresent(message = "End date must be today or in the future")
    private LocalDate endDate;
}