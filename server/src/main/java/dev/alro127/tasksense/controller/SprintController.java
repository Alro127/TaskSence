package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateSprintRequest;
import dev.alro127.tasksense.dto.request.UpdateSprintRequest;
import dev.alro127.tasksense.dto.response.SprintResponse;
import dev.alro127.tasksense.service.SprintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping
    public ResponseEntity<ApiResponse<SprintResponse>> createSprint(
            @Valid @RequestBody CreateSprintRequest request
    ) {

        SprintResponse sprint = sprintService.createSprint(request);

        ApiResponse<SprintResponse> response = new ApiResponse<>(
                "200",
                "Create sprint successfully",
                sprint,
                null
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{sprintId}")
    public ResponseEntity<ApiResponse<SprintResponse>> updateSprint(
            @PathVariable Long sprintId,
            @Valid @RequestBody UpdateSprintRequest request
    ) {

        SprintResponse sprint = sprintService.updateSprint(sprintId, request);

        ApiResponse<SprintResponse> response = new ApiResponse<>(
                "200",
                "Update sprint successfully",
                sprint,
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{sprintId}")
    public ResponseEntity<ApiResponse<Void>> deleteSprint(
            @PathVariable Long sprintId
    ) {

        sprintService.deleteSprint(sprintId);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete sprint successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<PageResponse<SprintResponse>>> getProjectSprints(
            @PathVariable Long projectId,
            Pageable pageable
    ) {

        PageResponse<SprintResponse> sprints =
                sprintService.getProjectSprints(projectId, pageable);

        ApiResponse<PageResponse<SprintResponse>> response =
                new ApiResponse<>(
                        "200",
                        "Get project sprints successfully",
                        sprints,
                        null
                );

        return ResponseEntity.ok(response);
    }
}
