package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSkillResponse {

    private Long id;
    private String skillName;
    private Integer level;
}