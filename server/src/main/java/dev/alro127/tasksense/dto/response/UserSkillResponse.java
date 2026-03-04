package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.UserSkillEntity;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSkillResponse {

    private Long id;
    private String skillName;
    private Integer level;

    public static UserSkillResponse mapToResponse(UserSkillEntity entity) {
        return UserSkillResponse.builder()
                .id(entity.getId())
                .skillName(entity.getSkillName())
                .level(entity.getLevel())
                .build();
    }
}