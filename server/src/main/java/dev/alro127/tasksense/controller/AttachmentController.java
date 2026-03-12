package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.CreateAttachmentsRequest;
import dev.alro127.tasksense.dto.request.DeleteAttachmentsRequest;
import dev.alro127.tasksense.dto.response.AttachmentResponse;
import dev.alro127.tasksense.service.AttachmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    //TODO: Check quyền thêm attachments
    @PostMapping
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> createAttachments(
            @Valid @RequestBody CreateAttachmentsRequest request) {

        List<AttachmentResponse> attachments =
                attachmentService.createAttachments(request);

        ApiResponse<List<AttachmentResponse>> response = new ApiResponse<>(
                "200",
                "Create attachments successfully",
                attachments,
                null
        );

        return ResponseEntity.ok(response);
    }

    //TODO: Check quyền xem attachments
    @GetMapping("/task/{taskId}")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getTaskAttachments(
            @PathVariable Long taskId) {

        List<AttachmentResponse> attachments =
                attachmentService.getTaskAttachments(taskId);

        ApiResponse<List<AttachmentResponse>> response = new ApiResponse<>(
                "200",
                "Get attachments successfully",
                attachments,
                null
        );

        return ResponseEntity.ok(response);
    }

    //TODO: Check quyền xóa attachments
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAttachments(
            @Valid @RequestBody DeleteAttachmentsRequest request) {

        attachmentService.deleteAttachments(request.getAttachmentIds());

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete attachments successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }
}