package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.CreateWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.response.WorkspaceJoinRequestResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WorkspaceJoinRequestService {

    WorkspaceJoinRequestResponse createJoinRequest(
            Long workspaceId,
            CreateWorkspaceJoinRequest request
    );

    PageResponse<WorkspaceJoinRequestResponse> getWorkspaceJoinRequests(
            Long workspaceId,
            Pageable pageable
    );

    WorkspaceJoinRequestResponse reviewJoinRequest(
            Long requestId,
            ReviewWorkspaceJoinRequest request
    );

    WorkspaceJoinRequestResponse cancelJoinRequest(
            Long requestId
    );

}