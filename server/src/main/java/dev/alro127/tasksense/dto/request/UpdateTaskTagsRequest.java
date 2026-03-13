package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class UpdateTaskTagsRequest {

    @NotEmpty(message = "Tag ids cannot be empty")
    private List<Long> tagIds;

}