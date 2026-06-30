package dev.alro127.tasksense.service;

import org.springframework.security.core.Authentication;

import dev.alro127.tasksense.domain.entity.UserEntity;

public interface SecurityService {

    Authentication getAuthentication();

    String getCurrentUsername();

    UserEntity getCurrentUser();

    Long getCurrentUserId();
}