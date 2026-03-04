package dev.alro127.tasksense.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BulkInviteResult {

    private List<WorkspaceInviteResponse> success;

    private List<FailedInvite> failed;

    @Data
    @Builder
    public static class FailedInvite {
        private String email;
        private String reason;
    }
}
