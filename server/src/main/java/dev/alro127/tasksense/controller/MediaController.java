package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.MediaRequest;
import dev.alro127.tasksense.dto.common.MediaResponse;
import dev.alro127.tasksense.service.MediaService;
import dev.alro127.tasksense.util.S3.S3FileHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;
    @PostMapping("/presign/image")
    public ResponseEntity<ApiResponse<MediaResponse>> getAvatarPresignUrl(@RequestBody MediaRequest request) {
        MediaResponse mediaResponse = mediaService.getAvatarUploadUrl(request);
        ApiResponse<MediaResponse> response = new ApiResponse<>(
                "200",
                "Url to upload image",
                mediaResponse,
                null
        );
        return ResponseEntity.ok(response);
    }
}
