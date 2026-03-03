package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AddTeamMemberTemplateRequest {

    @NotEmpty(message = "User ids must not be empty")
    private List<@NotNull(message = "User id must not be null") Long> userIds;
}