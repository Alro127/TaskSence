package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.UpdateUserRequest;
import dev.alro127.tasksense.dto.response.UserResponse;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public interface UserService {
    UserResponse getCurrentUser();

    UserResponse getUser(Long userId);

    UserResponse updateCurrentUser(UpdateUserRequest request);

    void deleteUser(Long id);

    List<UserResponse> searchUsersWithCursor(String keyword, Long cursor, int limit);
}
