package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class ChatSessionResponse {
    private Long id;
    private String title;
    private List<ChatMessageResponse> messages;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
