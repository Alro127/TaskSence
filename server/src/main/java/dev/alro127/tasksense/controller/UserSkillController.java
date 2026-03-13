package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.UserSkillRequest;
import dev.alro127.tasksense.dto.response.UserSkillResponse;
import dev.alro127.tasksense.service.UserSkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserSkillController {

        private final UserSkillService userSkillService;

        @GetMapping("/me/skills")
        public ResponseEntity<ApiResponse<PageResponse<UserSkillResponse>>> getMySkills(Pageable pageable) {

                ApiResponse<PageResponse<UserSkillResponse>> response = new ApiResponse<>(
                                "200",
                                "Get my skills successfully",
                                userSkillService.getMySkills(pageable),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{userId}/skills")
        public ResponseEntity<ApiResponse<PageResponse<UserSkillResponse>>> getUserSkills(
                        @PathVariable Long userId, Pageable pageable) {

                ApiResponse<PageResponse<UserSkillResponse>> response = new ApiResponse<>(
                                "200",
                                "Get user skills successfully",
                                userSkillService.getSkillsByUserId(userId, pageable),
                                null);

                return ResponseEntity.ok(response);
        }

        @PostMapping("/me/skills")
        public ResponseEntity<ApiResponse<UserSkillResponse>> addSkill(
                        @Valid @RequestBody UserSkillRequest request) {

                ApiResponse<UserSkillResponse> response = new ApiResponse<>(
                                "200",
                                "Add skill successfully",
                                userSkillService.addSkill(request),
                                null);

                return ResponseEntity.ok(response);
        }

        @PutMapping("/me/skills/{skillId}")
        public ResponseEntity<ApiResponse<UserSkillResponse>> updateSkill(
                        @PathVariable Long skillId,
                        @Valid @RequestBody UserSkillRequest request) {

                ApiResponse<UserSkillResponse> response = new ApiResponse<>(
                                "200",
                                "Update skill successfully",
                                userSkillService.updateSkill(skillId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/me/skills/{skillId}")
        public ResponseEntity<ApiResponse<Void>> deleteSkill(
                        @PathVariable Long skillId) {

                userSkillService.deleteSkill(skillId);

                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Delete skill successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }
}