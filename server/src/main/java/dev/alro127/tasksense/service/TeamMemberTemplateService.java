package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.AddTeamMemberTemplateRequest;
import dev.alro127.tasksense.dto.response.AddTeamMemberResultItem;
import dev.alro127.tasksense.dto.response.TeamMemberTemplateResponse;

import java.util.List;

public interface TeamMemberTemplateService {

    List<AddTeamMemberResultItem> addMembers(Long templateId,
                                             AddTeamMemberTemplateRequest request);

    List<TeamMemberTemplateResponse> getMembers(Long templateId);

    void removeMember(Long templateId, Long userId);
}