package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTagRequest {

    @NotBlank(message = "Tag name cannot be empty")
    private String name;

    private String color;
}