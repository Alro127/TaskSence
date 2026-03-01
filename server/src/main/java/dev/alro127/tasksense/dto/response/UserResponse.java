package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

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
}