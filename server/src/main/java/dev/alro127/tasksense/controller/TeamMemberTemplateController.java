package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.AddTeamMemberTemplateRequest;
import dev.alro127.tasksense.dto.response.AddTeamMemberResultItem;
import dev.alro127.tasksense.dto.response.TeamMemberTemplateResponse;
import dev.alro127.tasksense.service.TeamMemberTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/team-templates/{templateId}/members")
@RequiredArgsConstructor
public class TeamMemberTemplateController {

    private final TeamMemberTemplateService teamMemberTemplateService;

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<AddTeamMemberResultItem>>> addMembers(
            @PathVariable Long templateId,
            @Valid @RequestBody AddTeamMemberTemplateRequest request) {

        ApiResponse<List<AddTeamMemberResultItem>> response = new ApiResponse<>(
                "200",
                "Add team member successfully",
                teamMemberTemplateService.addMembers(templateId, request),
                null
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamMemberTemplateResponse>>> getMembers(
            @PathVariable Long templateId) {

        ApiResponse<List<TeamMemberTemplateResponse>> response = new ApiResponse<>(
                "200",
                "Get team members successfully",
                teamMemberTemplateService.getMembers(templateId),
                null
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long templateId,
            @PathVariable Long userId) {

        teamMemberTemplateService.removeMember(templateId, userId);

        ApiResponse<Void> response = new ApiResponse<>(
                "200",
                "Remove team member successfully",
                null,
                null
        );

        return ResponseEntity.ok(response);
    }
}