package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.enums.MemberAddStatus;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AddProjectMemberResultItem {

    private Long userId;
    private ProjectMemberRole role;
    private MemberAddStatus status;
}
