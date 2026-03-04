package dev.alro127.tasksense.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateBulkWorkspaceInviteRequest {
    @NotEmpty(message = "Invite list must not be empty")
    private List<@Valid BulkInviteItemRequest> invites;
}
