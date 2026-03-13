package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.TeamTemplateRequest;
import dev.alro127.tasksense.dto.response.TeamTemplateResponse;

import org.springframework.data.domain.Pageable;

public interface TeamTemplateService {

    TeamTemplateResponse createTemplate(TeamTemplateRequest request);

    PageResponse<TeamTemplateResponse> getMyTemplates(Pageable pageable);

    TeamTemplateResponse getTemplateById(Long id);

    TeamTemplateResponse updateTemplate(Long id, TeamTemplateRequest request);

    void deleteTemplate(Long id);
}