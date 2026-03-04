package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateWorkspaceRoleRequest {
    @NotNull(message = "Role is required")
    private WorkspaceRole role;
}
