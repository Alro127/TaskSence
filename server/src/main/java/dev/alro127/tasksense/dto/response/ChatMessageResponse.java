package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.enums.ChatRole;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class ChatMessageResponse {
    private Long id;
    private ChatRole role;
    private String content;
    private List<ChatSourceItem> sources;
    private OffsetDateTime createdAt;
}
