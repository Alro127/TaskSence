package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class McpExecuteRequest {

    @NotBlank(message = "Action is required")
    private String action;

    @NotNull(message = "actorUserId is required")
    private Long actorUserId;

    @NotNull(message = "arguments is required")
    private Map<String, Object> arguments;
}
