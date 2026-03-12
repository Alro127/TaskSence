package dev.alro127.tasksense.service;

import org.springframework.data.domain.Pageable;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRoleRequest;
import dev.alro127.tasksense.dto.response.WorkspaceMemberResponse;

public interface WorkspaceMemberService {

    PageResponse<WorkspaceMemberResponse> getWorkspaceMembers(Long workspaceId, Pageable pageable);

    void addUserToWorkspace(Long workspaceId, Long userId);

    WorkspaceMemberResponse updateMemberRole(Long workspaceId,
            Long memberId,
            UpdateWorkspaceRoleRequest request);

    void removeMember(Long workspaceId, Long memberId);

}