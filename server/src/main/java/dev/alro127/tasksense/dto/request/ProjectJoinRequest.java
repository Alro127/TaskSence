package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectJoinRequest {

    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String message;
}
