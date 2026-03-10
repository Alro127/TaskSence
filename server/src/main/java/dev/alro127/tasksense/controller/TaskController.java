package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.request.UpdateTaskRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskStatusRequest;
import dev.alro127.tasksense.dto.response.TaskResponse;
import dev.alro127.tasksense.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

        private final TaskService taskService;

        @PostMapping
        public ResponseEntity<ApiResponse<TaskResponse>> createTask(
                        @PathVariable Long projectId,
                        @Valid @RequestBody CreateTaskRequest request) {
                ApiResponse<TaskResponse> response = new ApiResponse<>(
                                "201",
                                "Create task successfully",
                                taskService.createTask(projectId, request),
                                null);

                return ResponseEntity.status(201).body(response);
        }

        @GetMapping
        public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksByProject(
                        @PathVariable Long projectId) {
                ApiResponse<List<TaskResponse>> response = new ApiResponse<>(
                                "200",
                                "Get tasks successfully",
                                taskService.getTasksByProject(projectId),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/search")
        public ResponseEntity<ApiResponse<List<TaskResponse>>> searchTasks(
                        @PathVariable Long projectId,
                        @RequestParam(required = false) TaskStatus status,
                        @RequestParam(required = false) TaskPriority priority,
                        @RequestParam(required = false) Long assigneeId,
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateFrom,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDateTo,
                        @RequestParam(defaultValue = "1") int page,
                        @RequestParam(defaultValue = "20") int size) {
                ApiResponse<List<TaskResponse>> response = new ApiResponse<>(
                                "200",
                                "Search tasks successfully",
                                taskService.searchTasks(projectId, status, priority, assigneeId, keyword,
                                                dueDateFrom, dueDateTo, page, size),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{taskId}")
        public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(
                        @PathVariable Long projectId,
                        @PathVariable Long taskId) {
                ApiResponse<TaskResponse> response = new ApiResponse<>(
                                "200",
                                "Get task successfully",
                                taskService.getTaskById(projectId, taskId),
                                null);

                return ResponseEntity.ok(response);
        }

        @GetMapping("/{taskId}/subtasks")
        public ResponseEntity<ApiResponse<List<TaskResponse>>> getSubTasks(
                        @PathVariable Long projectId,
                        @PathVariable Long taskId) {
                ApiResponse<List<TaskResponse>> response = new ApiResponse<>(
                                "200",
                                "Get subtasks successfully",
                                taskService.getSubTasks(projectId, taskId),
                                null);

                return ResponseEntity.ok(response);
        }

        @PutMapping("/{taskId}")
        public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
                        @PathVariable Long projectId,
                        @PathVariable Long taskId,
                        @Valid @RequestBody UpdateTaskRequest request) {
                ApiResponse<TaskResponse> response = new ApiResponse<>(
                                "200",
                                "Update task successfully",
                                taskService.updateTask(projectId, taskId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @PatchMapping("/{taskId}/status")
        public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
                        @PathVariable Long projectId,
                        @PathVariable Long taskId,
                        @Valid @RequestBody UpdateTaskStatusRequest request) {
                ApiResponse<TaskResponse> response = new ApiResponse<>(
                                "200",
                                "Update task status successfully",
                                taskService.updateTaskStatus(projectId, taskId, request),
                                null);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/{taskId}")
        public ResponseEntity<ApiResponse<Void>> deleteTask(
                        @PathVariable Long projectId,
                        @PathVariable Long taskId) {
                taskService.deleteTask(projectId, taskId);

                ApiResponse<Void> response = new ApiResponse<>(
                                "200",
                                "Delete task successfully",
                                null,
                                null);

                return ResponseEntity.ok(response);
        }
}
