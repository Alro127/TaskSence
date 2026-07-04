package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.config.provider.AWSConfig;
import dev.alro127.tasksense.dto.common.MediaRequest;
import dev.alro127.tasksense.dto.common.MediaResponse;
import dev.alro127.tasksense.service.MediaService;
import dev.alro127.tasksense.util.S3.S3FileHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaServiceImpl implements MediaService {

    private final S3FileHandler s3FileHandler;
    private final AWSConfig.AWSConfigValue awsConfigValue;

    @Override
    public MediaResponse getAvatarUploadUrl(MediaRequest request) {
        validateImage(request.getExtension());

        String objectKey = buildAvatarKey(request.getFileName(), request.getExtension());

        String uploadUrl = s3FileHandler.generateUploadPresignedUrl(
                awsConfigValue.getBucket(),
                objectKey);

        return new MediaResponse(uploadUrl,
                objectKey,
                "https://" + awsConfigValue.getBucket() + "." + awsConfigValue.getEndpoint() + "/" + objectKey);
    }

    @Override
    public MediaResponse getDocumentUploadUrl(MediaRequest request) {
        validateImageOrDocument(request.getExtension());

        String objectKey = buildDocumentKey(request.getFileName(), request.getExtension());

        String uploadUrl = s3FileHandler.generateUploadPresignedUrl(
                awsConfigValue.getBucket(),
                objectKey);

        return new MediaResponse(uploadUrl,
                objectKey,
                "https://" + awsConfigValue.getBucket() + "." + awsConfigValue.getEndpoint() + "/" + objectKey);
    }

    private String buildAvatarKey(String fileName, String extension) {
        return "avatars/" + UUID.randomUUID() + "/" + fileName + extension;
    }

    private String buildDocumentKey(String fileName, String extension) {
        return "documents/" + UUID.randomUUID() + "/" + fileName + extension;
    }

    private void validateImage(String extension) {
        if (!extension.matches("\\.(jpg|jpeg|png|webp)$")) {
            throw new IllegalArgumentException("Invalid image type");
        }
    }

    private void validateImageOrDocument(String extension) {
        if (!extension.matches("\\.(jpg|jpeg|png|webp|pdf|doc|docx|xls|xlsx)$")) {
            throw new IllegalArgumentException("Invalid file type: must be an image or document");
        }
    }
}