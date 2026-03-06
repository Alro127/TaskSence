package dev.alro127.tasksense.dto.request;

import dev.alro127.tasksense.domain.enums.JoinRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewProjectJoinRequest {

    @NotNull(message = "Status is required")
    private JoinRequestStatus status;
}
