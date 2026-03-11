package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateCommentRequest {

    @NotBlank(message = "Content cannot be empty")
    private String content;
}