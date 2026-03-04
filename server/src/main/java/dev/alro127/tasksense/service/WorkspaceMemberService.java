package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.UpdateWorkspaceRoleRequest;
import dev.alro127.tasksense.dto.response.WorkspaceMemberResponse;

import java.util.List;

public interface WorkspaceMemberService {

    List<WorkspaceMemberResponse> getWorkspaceMembers(Long workspaceId);

    WorkspaceMemberResponse updateMemberRole(Long workspaceId,
                                             Long memberId,
                                             UpdateWorkspaceRoleRequest request);

    void removeMember(Long workspaceId, Long memberId);
}