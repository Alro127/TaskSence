package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CreateTaskRequest;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.request.UpdateTaskRequest;
import dev.alro127.tasksense.dto.request.UpdateTaskStatusRequest;
import dev.alro127.tasksense.dto.response.TaskResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public interface TaskService {

    TaskResponse createTask(Long projectId, CreateTaskRequest request);

    TaskResponse getTaskById(Long projectId, Long taskId);

    List<TaskResponse> getTasksByProject(Long projectId);

    List<TaskResponse> searchTasks(Long projectId, TaskStatus status, TaskPriority priority, Long assigneeId,
            String keyword, LocalDate dueDateFrom, LocalDate dueDateTo, Long cursor, int size);

    List<TaskResponse> getSubTasks(Long projectId, Long parentTaskId);

    TaskResponse updateTask(Long projectId, Long taskId, UpdateTaskRequest request);

    TaskResponse updateTaskStatus(Long projectId, Long taskId, UpdateTaskStatusRequest request);

    void deleteTask(Long projectId, Long taskId);
}
