package dev.alro127.tasksense.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateAttachmentsRequest {

    @NotNull(message = "Task id is required")
    private Long taskId;

    @NotEmpty(message = "Attachments cannot be empty")
    private List<FileInfo> files;

    @Data
    public static class FileInfo {

        @NotBlank
        private String fileUrl;

        private String fileType;

        private Long fileSize;
    }
}
