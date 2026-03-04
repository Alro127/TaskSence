package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CreateWorkspaceInviteRequest;
import dev.alro127.tasksense.dto.response.WorkspaceInviteResponse;

import java.util.List;

public interface WorkspaceInviteService {

    WorkspaceInviteResponse inviteMember(Long workspaceId,
                                         CreateWorkspaceInviteRequest request);

    List<WorkspaceInviteResponse> getWorkspaceInvites(Long workspaceId);

    WorkspaceInviteResponse acceptInvite(String token);

    void revokeInvite(Long inviteId);
}