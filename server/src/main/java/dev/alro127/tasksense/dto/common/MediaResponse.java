package dev.alro127.tasksense.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MediaResponse {
    private String uploadUrl;
    private String objectKey;
    private String fileUrl;
}
