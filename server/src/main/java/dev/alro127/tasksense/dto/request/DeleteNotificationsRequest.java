package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class DeleteNotificationsRequest {

    @NotEmpty(message = "Notification ids cannot be empty")
    private List<Long> ids;
}
