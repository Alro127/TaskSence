package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.AuthRequest;
import dev.alro127.tasksense.dto.response.AuthResponse;

public interface AuthService {
    void register(AuthRequest request);
    AuthResponse login(AuthRequest request);
    void sendOtp(String email);
    AuthResponse verifyOtp(String email, String otp);

    AuthResponse loginWithGoogle(String code);
}
