package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommentReactionRequest {

    @NotBlank(message = "Reaction icon is required")
    private String icon;
}