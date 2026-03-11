package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentCreateRequest {

    @NotNull(message = "Task id is required")
    private Long taskId;

    private Long parentCommentId;

    @NotBlank(message = "Content cannot be empty")
    private String content;
}