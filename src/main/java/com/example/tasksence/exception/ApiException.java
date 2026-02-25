package com.example.tasksence.exception;

public class ApiException extends RuntimeException {

    public ApiException(String message) {
        super(message);
    }
}