package dev.alro127.tasksense.dto.message;

import lombok.*;

import java.util.Map;

import dev.alro127.tasksense.domain.enums.EmailType;

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
