package dev.alro127.tasksense.dto.request;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class CommentCreateRequest {

    @NotNull(message = "Task id is required")
    private Long taskId;

    private Long parentCommentId;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    @JsonSetter(nulls = Nulls.AS_EMPTY)
    private Set<Long> mentionUserIds = new HashSet<>();
}