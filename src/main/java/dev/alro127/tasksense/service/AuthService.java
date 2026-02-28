package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.AuthRequest;
import dev.alro127.tasksense.dto.request.TokenRequest;
import dev.alro127.tasksense.dto.response.AuthResponse;

public interface AuthService {
    void register(AuthRequest request);
    AuthResponse login(AuthRequest request);
    AuthResponse refresh(TokenRequest request);
    void sendOtp(String email);
    AuthResponse verifyOtp(String email, String otp);
    void forgotPassword(String email);
    void resetPassword(String rawToken, String newPassword);
    AuthResponse loginWithGoogle(String code);
    void logout(TokenRequest tokenRequest);
}
