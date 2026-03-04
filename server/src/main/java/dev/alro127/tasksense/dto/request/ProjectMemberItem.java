package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectMemberItem {

    @NotNull(message = "User id is required")
    private Long userId;

    @NotNull(message = "Role is required")
    private ProjectMemberRole role;
}
