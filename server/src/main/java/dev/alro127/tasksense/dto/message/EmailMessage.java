package dev.alro127.tasksense.dto.message;

import dev.alro127.tasksense.domain.enums.EmailType;
import lombok.*;

import java.util.Map;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessage {
    private EmailType type;

    private String to;

    private String subject;

    private String content;

    private Map<String, Object> payload;
}
