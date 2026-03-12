package dev.alro127.tasksense.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class DeleteAttachmentsRequest {

    @NotEmpty(message = "Attachment ids cannot be empty")
    private List<Long> attachmentIds;

}
