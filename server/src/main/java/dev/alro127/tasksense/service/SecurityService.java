package dev.alro127.tasksense.service;

import dev.alro127.tasksense.domain.entity.UserEntity;
import org.springframework.security.core.Authentication;

public interface SecurityService {

    Authentication getAuthentication();

    String getCurrentUsername();

    UserEntity getCurrentUser();

    Long getCurrentUserId();
}