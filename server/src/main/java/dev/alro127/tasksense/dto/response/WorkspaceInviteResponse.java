package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

import dev.alro127.tasksense.domain.entity.WorkspaceInviteEntity;
import dev.alro127.tasksense.domain.enums.InviteStatus;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;

@Data
@Builder
public class WorkspaceInviteResponse {

    private Long id;

    private Long workspaceId;

    private String email;

    private WorkspaceRole role;

    private InviteStatus status;

    private OffsetDateTime invitedAt;

    private OffsetDateTime expiredAt;

    private OffsetDateTime acceptedAt;

    private Long invitedById;

    public static WorkspaceInviteResponse mapToResponse(WorkspaceInviteEntity invite) {
        return WorkspaceInviteResponse.builder()
                .id(invite.getId())
                .workspaceId(invite.getWorkspace().getId())
                .email(invite.getEmail())
                .role(invite.getRole())
                .status(invite.getStatus())
                .invitedAt(invite.getInvitedAt())
                .expiredAt(invite.getExpiredAt())
                .acceptedAt(invite.getAcceptedAt())
                .invitedById(invite.getInvitedBy().getId())
                .build();
    }
}