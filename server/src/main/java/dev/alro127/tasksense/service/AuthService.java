package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.AuthRequest;
import dev.alro127.tasksense.dto.response.AuthResponse;

public interface AuthService {
    public void register(AuthRequest request);
    public AuthResponse login(AuthRequest request);
    public void sendOtp(String email);
    public AuthResponse verifyOtp(String email, String otp);
}
