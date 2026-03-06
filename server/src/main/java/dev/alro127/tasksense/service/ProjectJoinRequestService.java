package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.ProjectJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewProjectJoinRequest;
import dev.alro127.tasksense.dto.response.ProjectJoinRequestResponse;

import java.util.List;

public interface ProjectJoinRequestService {

    ProjectJoinRequestResponse sendJoinRequest(Long projectId, ProjectJoinRequest request);

    List<ProjectJoinRequestResponse> getJoinRequests(Long projectId);

    ProjectJoinRequestResponse reviewJoinRequest(Long projectId, Long requestId, ReviewProjectJoinRequest request);

    void cancelJoinRequest(Long projectId, Long requestId);
}
