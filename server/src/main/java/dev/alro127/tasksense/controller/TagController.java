package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.CreateTagRequest;
import dev.alro127.tasksense.dto.request.UpdateTagRequest;
import dev.alro127.tasksense.dto.response.TagResponse;
import dev.alro127.tasksense.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/tags")
@RequiredArgsConstructor
public class TagController {

        private final TagService tagService;

        @PostMapping
        @PreAuthorize("@perm.project(#projectId, 'CREATE_TAG')")
        public ResponseEntity<ApiResponse<TagResponse>> createTag(
                        @PathVariable Long projectId,
                        @Valid @RequestBody CreateTagRequest request) {

                ApiResponse<TagResponse> response = new ApiResponse<>(
                                "200",
                                "Create tag successfully",
                                tagService.createTag(projectId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping
        @PreAuthorize("@perm.project(#projectId, 'VIEW_TAGS')")
        public ResponseEntity<ApiResponse<List<TagResponse>>> getTags(
                        @PathVariable Long projectId) {

                ApiResponse<List<TagResponse>> response = new ApiResponse<>(
                                "200",
                                "Get tags successfully",
                                tagService.getTagsByProject(projectId),
                                null);

                return ResponseEntity.ok(response);
        }

        @PutMapping("/{tagId}")
        @PreAuthorize("@perm.project(#projectId, 'UPDATE_TAG')")
        public ResponseEntity<ApiResponse<TagResponse>> updateTag(
                        @PathVariable Long projectId,
                        @PathVariable Long tagId,
                        @Valid @RequestBody UpdateTagRequest request) {

                ApiResponse<TagResponse> response = new ApiResponse<>(
                                "200",
                                "Update tag successfully",
                                tagService.updateTag(projectId, tagId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/{tagId}")
        @PreAuthorize("@perm.project(#projectId, 'DELETE_TAG')")
        public ResponseEntity<ApiResponse<Void>> deleteTag(
                        @PathVariable Long projectId,
                        @PathVariable Long tagId) {

                tagService.deleteTag(projectId, tagId);

                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Delete tag successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }
}