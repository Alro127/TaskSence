package dev.alro127.tasksense.dto.common;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@AllArgsConstructor
@Getter
public class ApiResponse<T> {
    private String code;
    private String message;
    private T data;
}
