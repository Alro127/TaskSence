package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateProjectMemberRoleRequest {

    @NotNull(message = "Role is required")
    private ProjectMemberRole role;
}
