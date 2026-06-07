package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.dto.request.UpdateUserRequest;
import dev.alro127.tasksense.dto.response.UserResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.event.EntityChangedEvent;
import dev.alro127.tasksense.event.EntityChangedEvent.Operation;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final SecurityService securityService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public UserResponse getCurrentUser() {

        UserEntity user = securityService.getCurrentUser();

        return UserResponse.mapToResponse(user);
    }

    @Override
    public UserResponse getUser(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.mapToResponse(user);
    }

    @Override
    @Transactional
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

        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.USER, user.getId(), Operation.UPSERT));
        return UserResponse.mapToResponse(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {

        UserEntity user = securityService.getCurrentUser();

        if (user.getDeletedAt() != null) {
            throw new BadRequestException("User already deleted");
        }

        user.setDeletedAt(OffsetDateTime.now());
        user.setIsActive(false);

        userRepository.save(user);
        eventPublisher.publishEvent(new EntityChangedEvent(EntityType.USER, user.getId(), Operation.DELETE));
    }

    @Override
    public List<UserResponse> searchUsersWithCursor(String keyword,
            Long cursor,
            int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        List<UserEntity> users = userRepository.searchUsers(keyword, cursor, pageable);

        return users.stream()
                .map(UserResponse::mapToResponse)
                .toList();
    }

}
