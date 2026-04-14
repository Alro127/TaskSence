package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.McpExecuteRequest;
import dev.alro127.tasksense.dto.response.McpExecuteResponse;

public interface McpService {

    McpExecuteResponse execute(McpExecuteRequest request);
}
