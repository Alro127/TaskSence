package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CreateWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.response.WorkspaceJoinRequestResponse;

import java.util.List;

public interface WorkspaceJoinRequestService {

    WorkspaceJoinRequestResponse createJoinRequest(
            Long workspaceId,
            CreateWorkspaceJoinRequest request
    );

    List<WorkspaceJoinRequestResponse> getWorkspaceJoinRequests(
            Long workspaceId
    );

    WorkspaceJoinRequestResponse reviewJoinRequest(
            Long requestId,
            ReviewWorkspaceJoinRequest request
    );

    WorkspaceJoinRequestResponse cancelJoinRequest(
            Long requestId
    );

}