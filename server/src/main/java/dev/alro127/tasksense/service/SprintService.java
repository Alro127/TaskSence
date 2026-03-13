package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateSprintRequest;
import dev.alro127.tasksense.dto.request.UpdateSprintRequest;
import dev.alro127.tasksense.dto.response.SprintResponse;
import org.springframework.data.domain.Pageable;

public interface SprintService {

    SprintResponse createSprint(CreateSprintRequest request);

    SprintResponse updateSprint(Long sprintId, UpdateSprintRequest request);

    void deleteSprint(Long sprintId);

    PageResponse<SprintResponse> getProjectSprints(Long projectId, Pageable pageable);
}