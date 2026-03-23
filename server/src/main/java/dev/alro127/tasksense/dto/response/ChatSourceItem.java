package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatSourceItem {
    private String type;   // TASK | PROJECT | COMMENT
    private Long id;
    private String title;
    private Long projectId;
    private String projectName;
}
