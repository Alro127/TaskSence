package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CreateAttachmentsRequest;
import dev.alro127.tasksense.dto.response.AttachmentResponse;

import java.util.List;

public interface AttachmentService {

    List<AttachmentResponse> createAttachments(CreateAttachmentsRequest request);

    List<AttachmentResponse> getTaskAttachments(Long taskId);

    void deleteAttachments(List<Long> attachmentIds);

}