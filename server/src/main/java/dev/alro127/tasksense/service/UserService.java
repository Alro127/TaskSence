package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.UpdateUserRequest;
import dev.alro127.tasksense.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse getCurrentUser();

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    UserResponse updateCurrentUser(UpdateUserRequest request);

    void deleteUser(Long id);
}
