package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.AddProjectMemberRequest;
import dev.alro127.tasksense.dto.request.UpdateProjectMemberRoleRequest;
import dev.alro127.tasksense.dto.response.AddProjectMemberResultItem;
import dev.alro127.tasksense.dto.response.ProjectMemberResponse;

import java.util.List;

public interface ProjectMemberService {

    List<AddProjectMemberResultItem> addMembers(Long projectId, AddProjectMemberRequest request);

    List<ProjectMemberResponse> getMembers(Long projectId);

    ProjectMemberResponse updateMemberRole(Long projectId, Long userId, UpdateProjectMemberRoleRequest request);

    void removeMember(Long projectId, Long userId);

    String getCurrentUserRole(Long projectId);
}
