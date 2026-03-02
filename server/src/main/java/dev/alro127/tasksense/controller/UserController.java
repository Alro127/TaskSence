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
                null
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateUserRequest request
    ) {
        ApiResponse<UserResponse> response = new ApiResponse<>(
                "200",
                "Update profile successfully",
                userService.updateCurrentUser(request),
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete user successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/upload-avatar")
    public ResponseEntity<ApiResponse<Void>> uploadAvatar(@PathParam("url") String url) {
        userService.updateAvatar(url);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Update avatar successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }
}