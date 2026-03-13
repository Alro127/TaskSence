package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.AddTeamMemberTemplateRequest;
import dev.alro127.tasksense.dto.response.AddTeamMemberResultItem;
import dev.alro127.tasksense.dto.response.TeamMemberTemplateResponse;

import java.util.List;

import org.springframework.data.domain.Pageable;

public interface TeamMemberTemplateService {

    List<AddTeamMemberResultItem> addMembers(Long templateId,
            AddTeamMemberTemplateRequest request);

    PageResponse<TeamMemberTemplateResponse> getMembers(Long templateId, Pageable pageable);

    void removeMember(Long templateId, Long userId);
}