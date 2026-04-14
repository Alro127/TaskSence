package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.McpExecuteRequest;
import dev.alro127.tasksense.dto.response.McpExecuteResponse;
import dev.alro127.tasksense.service.McpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/mcp")
public class McpController {

    private final McpService mcpService;

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<McpExecuteResponse>> execute(@Valid @RequestBody McpExecuteRequest request) {
        McpExecuteResponse data = mcpService.execute(request);
        ApiResponse<McpExecuteResponse> response = new ApiResponse<>(
                "200",
                "MCP action executed",
                data,
                null
        );
        return ResponseEntity.ok(response);
    }
}
