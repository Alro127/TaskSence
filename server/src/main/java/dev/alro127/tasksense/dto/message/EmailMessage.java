package dev.alro127.tasksense.dto.message;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@RequiredArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class EmailMessage {
    private String to;
    private String subject;
    private String content;
}
