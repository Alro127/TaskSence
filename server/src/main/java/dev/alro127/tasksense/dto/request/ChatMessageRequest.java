package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatMessageRequest {

    @NotBlank
    @Size(max = 2000)
    private String content;

    // Optional: context from the frontend (which page the user is on)
    private ChatContext context;

    @Data
    public static class ChatContext {
        private Long workspaceId;
        private Long projectId;
    }
}
