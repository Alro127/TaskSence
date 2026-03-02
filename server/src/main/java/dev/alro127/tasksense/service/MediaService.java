package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.MediaRequest;
import dev.alro127.tasksense.dto.common.MediaResponse;

public interface MediaService {

    MediaResponse getAvatarUploadUrl(MediaRequest request);

    MediaResponse getDocumentUploadUrl(MediaRequest request);
}
