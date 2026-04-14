package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertWorkflowRatingRequest {

    @NotNull(message = "Stars is required")
    @Min(value = 1, message = "Stars must be at least 1")
    @Max(value = 5, message = "Stars must be at most 5")
    private Integer stars;

    @Size(max = 500, message = "Review text must not exceed 500 characters")
    private String reviewText;
}
