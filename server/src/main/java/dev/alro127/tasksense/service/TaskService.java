package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.request.UpdateTaskRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskStatusRequest;
import dev.alro127.tasksense.dto.response.TaskResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public interface TaskService {

    TaskResponse createTask(Long projectId, CreateTaskRequest request);

    TaskResponse getTaskById(Long projectId, Long taskId);

    PageResponse<TaskResponse> getTasksByProject(Long projectId, Pageable pageable);

    PageResponse<TaskResponse> searchTasks(Long projectId, TaskStatus status, TaskPriority priority, Long assigneeId,
            Long sprintId, List<Long> tagIds,
            String keyword, OffsetDateTime dueDateFrom, OffsetDateTime dueDateTo, Pageable pageable);

    PageResponse<TaskResponse> getSubTasks(Long projectId, Long parentTaskId, Pageable pageable);

    TaskResponse updateTask(Long projectId, Long taskId, UpdateTaskRequest request);

    TaskResponse updateTaskStatus(Long projectId, Long taskId, UpdateTaskStatusRequest request);

    void deleteTask(Long projectId, Long taskId);

    void addTagsToTask(Long projectId, Long taskId, List<Long> tagIds);

    void removeTagsFromTask(Long projectId, Long taskId, List<Long> tagIds);
}
