package dev.alro127.tasksense.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AddProjectMemberRequest {

    @NotEmpty(message = "Members list must not be empty")
    private List<@Valid ProjectMemberItem> members;
}
