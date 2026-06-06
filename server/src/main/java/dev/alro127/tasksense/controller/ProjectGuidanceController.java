package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.domain.entity.ProjectGuidanceProgressEntity;
import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.service.ProjectGuidanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/projects/{projectId}/guidance")
public class ProjectGuidanceController {

    private final ProjectGuidanceService projectGuidanceService;

    @PostMapping("/start")
    @PreAuthorize("@perm.isProjectMember(#projectId)")
    public ResponseEntity<ApiResponse<ProjectGuidanceProgressEntity>> startGuidance(
            @PathVariable Long projectId,
            @RequestParam Long workflowId) {
        
        ProjectGuidanceProgressEntity progress = projectGuidanceService.startGuidance(projectId, workflowId);
        ApiResponse<ProjectGuidanceProgressEntity> response = new ApiResponse<>(
                "200",
                "Guidance started successfully",
                progress,
                null);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/progress")
    @PreAuthorize("@perm.isProjectMember(#projectId)")
    public ResponseEntity<ApiResponse<ProjectGuidanceProgressEntity>> getProgress(@PathVariable Long projectId) {
        ProjectGuidanceProgressEntity progress = projectGuidanceService.getProgress(projectId);
        ApiResponse<ProjectGuidanceProgressEntity> response = new ApiResponse<>(
                "200",
                "Get guidance progress successfully",
                progress,
                null);
        
        return ResponseEntity.ok(response);
    }
}
