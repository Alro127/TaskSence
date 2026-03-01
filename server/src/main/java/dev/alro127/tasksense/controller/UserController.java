package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.UpdateUserRequest;
import dev.alro127.tasksense.dto.response.UserResponse;
import dev.alro127.tasksense.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile() {
        ApiResponse<UserResponse> response = new ApiResponse<>(
                "200",
                "Get profile successfully",
                userService.getCurrentUser()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        ApiResponse<UserResponse> response = new ApiResponse<>(
                "200",
                "Get user successfully",
                userService.getUserById(id)
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        ApiResponse<List<UserResponse>> response = new ApiResponse<>(
                "200",
                "Get user list successfully",
                userService.getAllUsers()
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @RequestBody UpdateUserRequest request
    ) {
        ApiResponse<UserResponse> response = new ApiResponse<>(
                "200",
                "Update profile successfully",
                userService.updateCurrentUser(request)
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete user successfully",
                null
        );

        return ResponseEntity.ok(response);
    }
}