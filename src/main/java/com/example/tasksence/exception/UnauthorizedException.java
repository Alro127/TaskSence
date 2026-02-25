package com.example.tasksence.exception;

public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(message);
    }
}