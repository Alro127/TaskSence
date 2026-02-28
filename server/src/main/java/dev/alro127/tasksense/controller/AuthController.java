package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.request.AuthRequest;
import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.ResetPasswordRequest;
import dev.alro127.tasksense.dto.request.TokenRequest;
import dev.alro127.tasksense.dto.response.AuthResponse;
import dev.alro127.tasksense.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@RequestBody AuthRequest request) {
        authService.register(request);
        return ResponseEntity.ok(new ApiResponse<>(
                "200",
                "Please check OTP in your email",
                null
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                "200",
                "Your OTP is verified",
                authService.verifyOtp(email, otp)
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/local")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody AuthRequest request) {
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                "200",
                "Welcome",
                authService.login(request)
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody TokenRequest request) {
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                "200",
                "Welcome",
                authService.refresh(request)
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/google")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(@RequestParam String code) {
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                "200",
                "Welcome",
                authService.loginWithGoogle(code)
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestParam String email) {
        authService.forgotPassword(email);
        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "If the email exists, a reset link has been sent.",
                null
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody ResetPasswordRequest request
    ) {

        authService.resetPassword(
                request.getToken(),
                request.getNewPassword()
        );

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Your password is reset",
                null
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody TokenRequest request) {
        authService.logout(request);
        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Logout successfully",
                null
        );

        return ResponseEntity.ok(response);
    }
}
