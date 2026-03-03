package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSkillRequest {

    @NotBlank(message = "Skill name must not be blank")
    private String skillName;

    @NotNull(message = "Level must not be null")
    @Min(value = 1, message = "Level must be between 1 and 5")
    @Max(value = 5, message = "Level must be between 1 and 5")
    private Integer level;
}