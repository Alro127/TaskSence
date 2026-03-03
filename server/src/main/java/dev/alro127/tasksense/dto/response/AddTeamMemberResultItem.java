package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.enums.MemberAddStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AddTeamMemberResultItem {

    private Long userId;
    private MemberAddStatus status;
}