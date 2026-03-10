package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.exception.ApiException;
import dev.alro127.tasksense.exception.ErrorResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

        // ===== NOT FOUND =====
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.NOT_FOUND.value(),
                                ex.getMessage(),
                                LocalDateTime.now());
                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }

        // ===== UNAUTHORIZED (JWT) =====
        @ExceptionHandler(UnauthorizedException.class)
        public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.UNAUTHORIZED.value(),
                                ex.getMessage(),
                                LocalDateTime.now());
                return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
        }

        // ===== FORBIDDEN (Permission denied by @PreAuthorize) =====
        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.FORBIDDEN.value(),
                                "You do not have permission to perform this action",
                                LocalDateTime.now());
                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
        }

        // ===== BAD REQUEST =====
        @ExceptionHandler(ApiException.class)
        public ResponseEntity<ErrorResponse> handleApi(ApiException ex) {
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.BAD_REQUEST.value(),
                                ex.getMessage(),
                                LocalDateTime.now());
                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        // ===== FALLBACK =====
        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponse> handleAll(Exception ex) {
                ErrorResponse error = new ErrorResponse(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                "Internal server error",
                                LocalDateTime.now());
                return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Object>> handleValidation(
                        MethodArgumentNotValidException ex) {

                Map<String, String> errors = new HashMap<>();

                ex.getBindingResult().getFieldErrors()
                                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

                ApiResponse<Object> response = ApiResponse.builder()
                                .code("400")
                                .message("Validation failed")
                                .data(null)
                                .errors(errors)
                                .build();

                return ResponseEntity.badRequest().body(response);
        }
}
