package dev.alro127.tasksense.dto.common;

import lombok.*;

import java.util.Map;

@RequiredArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class ApiResponse<T> {
    private String code;
    private String message;
    private T data;
    private Map<String, String> errors;
}
