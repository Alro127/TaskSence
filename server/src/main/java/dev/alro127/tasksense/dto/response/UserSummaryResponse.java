package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.UserEntity;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;

@Data
@Builder
public class UserSummaryResponse {
    private Long id;

    private String email;

    private String fullName;

    private String avatarUrl;

    public static UserSummaryResponse mapToResponse(UserEntity user) {
        if (user == null) {
            return null;
        }

        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
