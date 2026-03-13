package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.ProjectJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewProjectJoinRequest;
import dev.alro127.tasksense.dto.response.ProjectJoinRequestResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProjectJoinRequestService {

    ProjectJoinRequestResponse sendJoinRequest(Long projectId, ProjectJoinRequest request);

    PageResponse<ProjectJoinRequestResponse> getJoinRequests(Long projectId, Pageable pageable);

    ProjectJoinRequestResponse reviewJoinRequest(Long projectId, Long requestId, ReviewProjectJoinRequest request);

    void cancelJoinRequest(Long projectId, Long requestId);
}
