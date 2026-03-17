package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.response.ProjectAnalyticsResponse;
import dev.alro127.tasksense.service.SearchIndexService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/projects/{projectId}/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final SearchIndexService searchIndexService;

    @GetMapping
    @PreAuthorize("@perm.project(#projectId, 'VIEW_TASKS')")
    public ResponseEntity<ApiResponse<ProjectAnalyticsResponse>> getProjectAnalytics(
            @PathVariable Long projectId) {
        ApiResponse<ProjectAnalyticsResponse> response = new ApiResponse<>(
                "200",
                "Get project analytics successfully",
                searchIndexService.getProjectAnalytics(projectId),
                null);
        return ResponseEntity.ok(response);
    }
}
