package dev.alro127.tasksense.config.mcp;

import dev.alro127.tasksense.mcp.TaskSenseMcpTools;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpToolConfig {

    @Bean
    ToolCallbackProvider taskSenseToolCallbackProvider(TaskSenseMcpTools taskSenseMcpTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(taskSenseMcpTools)
                .build();
    }
}
