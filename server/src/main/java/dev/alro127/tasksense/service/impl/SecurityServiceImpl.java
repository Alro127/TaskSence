package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.context.annotation.RequestScope;

@RequestScope
@RequiredArgsConstructor
@Component
public class SecurityServiceImpl implements SecurityService {

    private final UserRepository userRepository;

    private UserEntity currentUser;

    @Override
    public Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    @Override
    public String getCurrentUsername() {
        Authentication authentication = getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("User is not authenticated");
        }

        return authentication.getName();
    }

    @Override
    public UserEntity getCurrentUser() {
        if (currentUser == null) {
            currentUser =  userRepository.findByEmail(getCurrentUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        return currentUser;
    }

    @Override
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}