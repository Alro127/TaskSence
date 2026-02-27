package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.request.AuthRequest;
import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.response.AuthResponse;
import dev.alro127.tasksense.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
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
    public ResponseEntity<ApiResponse<AuthResponse>> Login(@RequestBody AuthRequest request) {
        ApiResponse<AuthResponse> response = new ApiResponse<>(
                "200",
                "Welcome",
                authService.login(request)
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
}
