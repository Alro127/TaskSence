package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.Set;

@Data
@Builder
public class ProjectMemberResponse {

    private Long id;

    private Long projectId;

    private UserSummaryResponse user;

    private ProjectMemberRole role;

    private OffsetDateTime createdAt;

    private Set<String> permissions;

    public static ProjectMemberResponse mapToResponse(ProjectMemberEntity member) {
        return ProjectMemberResponse.builder()
                .id(member.getId())
                .projectId(member.getProject().getId())
                .user(UserSummaryResponse.mapToResponse(member.getUser()))
                .role(member.getRole())
                .createdAt(member.getCreatedAt())
                .build();
    }
}
