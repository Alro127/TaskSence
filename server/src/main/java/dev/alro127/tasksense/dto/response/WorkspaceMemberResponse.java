package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Set;

@Data
@Builder
public class WorkspaceMemberResponse {

    private Long id;

    private WorkspaceRole role;

    private OffsetDateTime joinedAt;

    private UserSummaryResponse user;

    private Set<String> permissions;

    public static WorkspaceMemberResponse mapToResponse(WorkspaceMemberEntity entity) {
        return WorkspaceMemberResponse.builder()
                .id(entity.getId())
                .role(entity.getRole())
                .joinedAt(entity.getJoinedAt())
                .user(UserSummaryResponse.mapToResponse(entity.getUser()))
                .build();
    }
}