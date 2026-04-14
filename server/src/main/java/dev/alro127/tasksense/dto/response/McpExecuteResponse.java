package dev.alro127.tasksense.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class McpExecuteResponse {
    private String action;
    private boolean executed;
    private String message;
    private Object result;
}
