package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.AddProjectMemberRequest;
import dev.alro127.tasksense.dto.request.UpdateProjectMemberRoleRequest;
import dev.alro127.tasksense.dto.response.AddProjectMemberResultItem;
import dev.alro127.tasksense.dto.response.ProjectMemberResponse;

import java.util.List;

import org.springframework.data.domain.Pageable;

public interface ProjectMemberService {

    List<AddProjectMemberResultItem> addMembers(Long projectId, AddProjectMemberRequest request);

    PageResponse<ProjectMemberResponse> getMembers(Long projectId, Pageable pageable);

    ProjectMemberResponse updateMemberRole(Long projectId, Long userId, UpdateProjectMemberRoleRequest request);

    void removeMember(Long projectId, Long userId);

    void leaveProject(Long projectId);

    String getCurrentUserRole(Long projectId);
}
