package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.AttachmentEntity;
import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.dto.request.CreateAttachmentsRequest;
import dev.alro127.tasksense.dto.response.AttachmentResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.AttachmentRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.service.AttachmentService;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final SecurityService securityService;

    @Override
    @Transactional
    public List<AttachmentResponse> createAttachments(CreateAttachmentsRequest request) {

        TaskEntity task = taskRepository.findById(request.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        UserEntity uploader = securityService.getCurrentUser();

        List<AttachmentEntity> attachments = request.getFiles()
                .stream()
                .map(file -> AttachmentEntity.builder()
                        .task(task)
                        .uploader(uploader)
                        .fileUrl(file.getFileUrl())
                        .fileType(file.getFileType())
                        .fileSize(file.getFileSize())
                        .build())
                .toList();

        attachmentRepository.saveAll(attachments);

        return attachments.stream()
                .map(AttachmentResponse::mapToResponse)
                .toList();
    }

    @Override
    public List<AttachmentResponse> getTaskAttachments(Long taskId) {

        return attachmentRepository.findByTaskId(taskId)
                .stream()
                .map(AttachmentResponse::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteAttachments(List<Long> attachmentIds) {

        List<AttachmentEntity> attachments =
                attachmentRepository.findByIdIn(attachmentIds);

        if (attachments.isEmpty()) {
            throw new RuntimeException("Attachments not found");
        }

        attachmentRepository.deleteAll(attachments);
    }

}