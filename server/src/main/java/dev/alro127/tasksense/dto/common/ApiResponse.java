package dev.alro127.tasksense.dto.common;

import lombok.*;

@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApiResponse<T> {
    private String code;
    private String message;
    private T data;
}
