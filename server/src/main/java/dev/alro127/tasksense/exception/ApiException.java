package dev.alro127.tasksense.exception;

public class ApiException extends RuntimeException {

    public ApiException(String message) {
        super(message);
    }
}