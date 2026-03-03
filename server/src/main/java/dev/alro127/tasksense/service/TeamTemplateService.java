package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.TeamTemplateRequest;
import dev.alro127.tasksense.dto.response.TeamTemplateResponse;

import java.util.List;

public interface TeamTemplateService {

    TeamTemplateResponse createTemplate(TeamTemplateRequest request);

    List<TeamTemplateResponse> getMyTemplates();

    TeamTemplateResponse getTemplateById(Long id);

    TeamTemplateResponse updateTemplate(Long id, TeamTemplateRequest request);

    void deleteTemplate(Long id);
}