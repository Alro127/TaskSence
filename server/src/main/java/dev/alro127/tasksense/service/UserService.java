package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.UpdateUserRequest;
import dev.alro127.tasksense.dto.response.UserResponse;
import org.springframework.stereotype.Service;


@Service
public interface UserService {
    UserResponse getCurrentUser();

    UserResponse updateCurrentUser(UpdateUserRequest request);

    void deleteUser(Long id);

}
