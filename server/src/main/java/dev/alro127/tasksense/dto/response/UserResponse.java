package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import dev.alro127.tasksense.domain.entity.UserEntity;

@Data
@Builder
public class UserResponse {

    private Long id;

    private String email;

    private String fullName;

    private Boolean isActive;

    private String avatarUrl;

    private String phone;

    private String gender;

    private LocalDate dob;

    private String bio;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static UserResponse mapToResponse(UserEntity user) {
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