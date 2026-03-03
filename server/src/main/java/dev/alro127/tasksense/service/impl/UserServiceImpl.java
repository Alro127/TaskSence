package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.dto.request.UpdateUserRequest;
import dev.alro127.tasksense.dto.response.UserResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final SecurityService securityService;

    @Override
    public UserResponse getCurrentUser() {

        UserEntity user = securityService.getCurrentUser();

        return mapToResponse(user);
    }

    @Override
    public UserResponse updateCurrentUser(UpdateUserRequest request) {

        UserEntity user = securityService.getCurrentUser();

        // ===== Partial Update =====

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        if (request.getDob() != null) {
            user.setDob(request.getDob());
        }

        if (request.getBio() != null) {
            user.setBio(request.getBio().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        userRepository.save(user);

        return mapToResponse(user);
    }


    @Override
    public void deleteUser(Long id) {

        UserEntity user = securityService.getCurrentUser();

        if (user.getDeletedAt() != null) {
            throw new BadRequestException("User already deleted");
        }

        user.setDeletedAt(OffsetDateTime.now());
        user.setIsActive(false);

        userRepository.save(user);
    }

    private UserResponse mapToResponse(UserEntity user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .isActive(user.getIsActive())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .gender(user.getGender() != null ? user.getGender().toString() : null)
                .dob(user.getDob())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
