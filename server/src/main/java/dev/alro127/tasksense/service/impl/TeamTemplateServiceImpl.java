package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.TeamTemplateEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.TeamTemplateRequest;
import dev.alro127.tasksense.dto.response.TeamMemberTemplateResponse;
import dev.alro127.tasksense.dto.response.TeamTemplateResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.TeamMemberTemplateRepository;
import dev.alro127.tasksense.repository.jpa.TeamTemplateRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.TeamTemplateService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamTemplateServiceImpl implements TeamTemplateService {

    private final TeamTemplateRepository teamTemplateRepository;
    private final TeamMemberTemplateRepository teamMemberTemplateRepository;
    private final SecurityService securityService;

    @Override
    public TeamTemplateResponse createTemplate(TeamTemplateRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        TeamTemplateEntity entity = new TeamTemplateEntity();
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setOwner(currentUser);

        teamTemplateRepository.save(entity);

        return TeamTemplateResponse.mapToResponse(entity, null);
    }

    @Override
    public PageResponse<TeamTemplateResponse> getMyTemplates(Pageable pageable) {

        UserEntity currentUser = securityService.getCurrentUser();

        Page<TeamTemplateEntity> templatePage = teamTemplateRepository.findByOwnerId(currentUser.getId(), pageable);

        List<Long> templateIds = templatePage.getContent()
                .stream()
                .map(TeamTemplateEntity::getId)
                .toList();

        Map<Long, Long> memberCountMap = teamMemberTemplateRepository
                .countMembersByTemplateIds(templateIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]));

        Page<TeamTemplateResponse> responsePage = templatePage.map(template -> TeamTemplateResponse.mapToResponse(
                template,
                memberCountMap.getOrDefault(template.getId(), 0L)));

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    public TeamTemplateResponse getTemplateById(Long id) {

        UserEntity currentUser = securityService.getCurrentUser();

        TeamTemplateEntity entity = teamTemplateRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team template not found"));

        Long memberCount = teamMemberTemplateRepository.countByTeamTemplateId(id);

        if (!entity.getOwner().getId().equals(currentUser.getId())) {
            throw new EntityNotFoundException("Team template not found");
        }

        return TeamTemplateResponse.mapToResponse(entity, memberCount);
    }

    @Override
    public TeamTemplateResponse updateTemplate(Long id, TeamTemplateRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        TeamTemplateEntity entity = teamTemplateRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team template not found"));

        if (!entity.getOwner().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Team template not found");
        }

        entity.setName(request.getName());
        entity.setDescription(request.getDescription());

        teamTemplateRepository.save(entity);

        Long memberCount = teamMemberTemplateRepository.countByTeamTemplateId(id);

        return TeamTemplateResponse.mapToResponse(entity, memberCount);
    }

    @Override
    public void deleteTemplate(Long id) {

        UserEntity currentUser = securityService.getCurrentUser();

        TeamTemplateEntity entity = teamTemplateRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team template not found"));

        if (!entity.getOwner().getId().equals(currentUser.getId())) {
            throw new ResourceNotFoundException("Team template not found");
        }

        entity.setDeletedAt(OffsetDateTime.now());

        teamTemplateRepository.save(entity);
    }

}
