package dev.alro127.tasksense.dto.response;

import dev.alro127.tasksense.domain.entity.AttachmentEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AttachmentResponse {

    private Long id;

    private Long taskId;

    private Long uploaderId;

    private String fileUrl;

    private String fileType;

    private Long fileSize;

    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public static AttachmentResponse mapToResponse(AttachmentEntity entity) {
        return AttachmentResponse.builder()
                .id(entity.getId())
                .taskId(entity.getTask().getId())
                .uploaderId(entity.getUploader().getId())
                .fileUrl(entity.getFileUrl())
                .fileType(entity.getFileType())
                .fileSize(entity.getFileSize())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
