package dev.alro127.tasksense.service.impl;


import dev.alro127.tasksense.domain.entity.TeamTemplateEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.dto.request.TeamTemplateRequest;
import dev.alro127.tasksense.dto.response.TeamTemplateResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.TeamTemplateRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.TeamTemplateService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamTemplateServiceImpl implements TeamTemplateService {

    private final TeamTemplateRepository teamTemplateRepository;
    private final SecurityService securityService;

    @Override
    public TeamTemplateResponse createTemplate(TeamTemplateRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        TeamTemplateEntity entity = new TeamTemplateEntity();
        entity.setName(request.getName());
        entity.setDescription(request.getDescription());
        entity.setOwner(currentUser);

        teamTemplateRepository.save(entity);

        return mapToResponse(entity);
    }

    @Override
    public List<TeamTemplateResponse> getMyTemplates() {

        UserEntity currentUser = securityService.getCurrentUser();

        return teamTemplateRepository
                .findByOwnerId(currentUser.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TeamTemplateResponse getTemplateById(Long id) {

        UserEntity currentUser = securityService.getCurrentUser();

        TeamTemplateEntity entity = teamTemplateRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team template not found"));

        if (!entity.getOwner().getId().equals(currentUser.getId())) {
            throw new EntityNotFoundException("Team template not found");
        }

        return mapToResponse(entity);
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

        return mapToResponse(entity);
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

    private TeamTemplateResponse mapToResponse(TeamTemplateEntity entity) {
        return TeamTemplateResponse.builder()
                .id(entity.getId())
                .ownerId(entity.getOwner().getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
