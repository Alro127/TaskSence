package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.CreateBulkWorkspaceInviteRequest;
import dev.alro127.tasksense.dto.request.BulkInviteItemRequest;
import dev.alro127.tasksense.dto.response.BulkInviteResult;
import dev.alro127.tasksense.dto.response.WorkspaceInviteResponse;
import jakarta.validation.Valid;

import java.util.List;

public interface WorkspaceInviteService {

    WorkspaceInviteResponse inviteMember(Long workspaceId,
                                         BulkInviteItemRequest request);

    List<WorkspaceInviteResponse> getWorkspaceInvites(Long workspaceId);

    WorkspaceInviteResponse acceptInvite(String token);

    void revokeInvite(Long inviteId);

    BulkInviteResult inviteMultipleMembers(Long workspaceId, @Valid CreateBulkWorkspaceInviteRequest request);
}