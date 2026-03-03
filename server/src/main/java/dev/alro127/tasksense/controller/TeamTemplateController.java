package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.TeamTemplateRequest;
import dev.alro127.tasksense.dto.response.TeamTemplateResponse;
import dev.alro127.tasksense.service.TeamTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/team-templates")
@RequiredArgsConstructor
public class TeamTemplateController {

    private final TeamTemplateService teamTemplateService;

    @PostMapping
    public ResponseEntity<ApiResponse<TeamTemplateResponse>> createTemplate(
            @Valid @RequestBody TeamTemplateRequest request) {

        ApiResponse<TeamTemplateResponse> response = new ApiResponse<>(
                "200",
                "Create team template successfully",
                teamTemplateService.createTemplate(request),
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamTemplateResponse>>> getMyTemplates() {

        ApiResponse<List<TeamTemplateResponse>> response = new ApiResponse<>(
                "200",
                "Get team templates successfully",
                teamTemplateService.getMyTemplates(),
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamTemplateResponse>> getTemplateById(
            @PathVariable Long id) {

        ApiResponse<TeamTemplateResponse> response = new ApiResponse<>(
                "200",
                "Get team template successfully",
                teamTemplateService.getTemplateById(id),
                null
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamTemplateResponse>> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody TeamTemplateRequest request) {

        ApiResponse<TeamTemplateResponse> response = new ApiResponse<>(
                "200",
                "Update team template successfully",
                teamTemplateService.updateTemplate(id, request),
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(
            @PathVariable Long id) {

        teamTemplateService.deleteTemplate(id);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Delete team template successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }
}