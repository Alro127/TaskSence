package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.UpdateUserRequest;
import dev.alro127.tasksense.dto.response.UserResponse;
import dev.alro127.tasksense.service.UserService;
import jakarta.validation.Valid;
import jakarta.websocket.server.PathParam;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
                userService.getCurrentUser(),
                null);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserProfile(@PathVariable Long userId) {
        ApiResponse<UserResponse> response = new ApiResponse<>(
                "200",
                "Get profile successfully",
                userService.getUser(userId),
                null);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateUserRequest request) {
        ApiResponse<UserResponse> response = new ApiResponse<>(
                "200",
                "Update profile successfully",
                userService.updateCurrentUser(request),
                null);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete user successfully",
                null,
                null);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "10") int limit
    ) {

        List<UserResponse> users =
                userService.searchUsersWithCursor(keyword, cursor, limit);

        ApiResponse<List<UserResponse>> response = new ApiResponse<>(
                "200",
                "Load users successfully",
                users,
                null
        );

        return ResponseEntity.ok(response);
    }
}