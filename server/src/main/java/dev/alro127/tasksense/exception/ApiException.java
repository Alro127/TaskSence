package dev.alro127.tasksense.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    public ApiException(HttpStatus badRequest, String message) {
        super(message);
    }
}