package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.TeamMemberTemplateEntity;
import dev.alro127.tasksense.domain.entity.TeamTemplateEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.MemberAddStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.request.AddTeamMemberTemplateRequest;
import dev.alro127.tasksense.dto.response.AddTeamMemberResultItem;
import dev.alro127.tasksense.dto.response.TeamMemberTemplateResponse;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.TeamMemberTemplateRepository;
import dev.alro127.tasksense.repository.jpa.TeamTemplateRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.TeamMemberTemplateService;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamMemberTemplateServiceImpl implements TeamMemberTemplateService {

        private final TeamMemberTemplateRepository teamMemberTemplateRepository;
        private final TeamTemplateRepository teamTemplateRepository;
        private final UserRepository userRepository;
        private final SecurityService securityService;

        @Override
        public List<AddTeamMemberResultItem> addMembers(Long templateId,
                        AddTeamMemberTemplateRequest request) {

                UserEntity currentUser = securityService.getCurrentUser();

                TeamTemplateEntity template = teamTemplateRepository
                                .findById(templateId)
                                .orElseThrow(() -> new ResourceNotFoundException("Team template not found"));

                if (!template.getOwner().getId().equals(currentUser.getId())) {
                        throw new ResourceNotFoundException("Team template not found");
                }

                List<Long> userIds = request.getUserIds();

                List<UserEntity> users = userRepository.findAllById(userIds);
                Set<Long> foundUserIds = users.stream()
                                .map(UserEntity::getId)
                                .collect(Collectors.toSet());

                List<TeamMemberTemplateEntity> existingMembers = teamMemberTemplateRepository
                                .findAllByTemplateIdAndUserIdsIgnoreRestriction(templateId, userIds);

                Map<Long, TeamMemberTemplateEntity> existingMap = existingMembers.stream()
                                .collect(Collectors.toMap(
                                                e -> e.getUser().getId(),
                                                e -> e));

                List<TeamMemberTemplateEntity> toSave = new ArrayList<>();
                List<AddTeamMemberResultItem> results = new ArrayList<>();

                for (Long userId : userIds) {

                        if (template.getOwner().getId().equals(userId)) {
                                results.add(AddTeamMemberResultItem.builder()
                                                .userId(userId)
                                                .status(MemberAddStatus.ALREADY_EXISTS)
                                                .build());
                                continue;
                        }

                        if (!foundUserIds.contains(userId)) {
                                results.add(AddTeamMemberResultItem.builder()
                                                .userId(userId)
                                                .status(MemberAddStatus.NOT_FOUND)
                                                .build());
                                continue;
                        }

                        TeamMemberTemplateEntity existing = existingMap.get(userId);

                        if (existing != null) {

                                if (existing.getDeletedAt() == null) {
                                        results.add(AddTeamMemberResultItem.builder()
                                                        .userId(userId)
                                                        .status(MemberAddStatus.ALREADY_EXISTS)
                                                        .build());
                                } else {
                                        existing.setDeletedAt(null);
                                        toSave.add(existing);

                                        results.add(AddTeamMemberResultItem.builder()
                                                        .userId(userId)
                                                        .status(MemberAddStatus.RESTORED)
                                                        .build());
                                }

                        } else {
                                TeamMemberTemplateEntity entity = new TeamMemberTemplateEntity();
                                entity.setTeamTemplate(template);
                                entity.setUser(
                                                users.stream()
                                                                .filter(u -> u.getId().equals(userId))
                                                                .findFirst()
                                                                .orElseThrow());

                                toSave.add(entity);

                                results.add(AddTeamMemberResultItem.builder()
                                                .userId(userId)
                                                .status(MemberAddStatus.CREATED)
                                                .build());
                        }
                }

                if (!toSave.isEmpty()) {
                        teamMemberTemplateRepository.saveAll(toSave);
                }

                return results;
        }

        @Override
        public PageResponse<TeamMemberTemplateResponse> getMembers(Long templateId, Pageable pageable) {

                UserEntity currentUser = securityService.getCurrentUser();

                TeamTemplateEntity template = teamTemplateRepository
                                .findById(templateId)
                                .orElseThrow(() -> new ResourceNotFoundException("Team template not found"));

                if (!template.getOwner().getId().equals(currentUser.getId())) {
                        throw new ResourceNotFoundException("Team template not found");
                }

                Page<TeamMemberTemplateResponse> responsePage = teamMemberTemplateRepository
                                .findByTeamTemplateId(templateId, pageable)
                                .map(TeamMemberTemplateResponse::mapToResponse);

                return new PageResponse<>(
                                responsePage.getContent(),
                                responsePage.getNumber(),
                                responsePage.getSize(),
                                responsePage.getTotalElements(),
                                responsePage.getTotalPages());
        }

        @Override
        public void removeMember(Long templateId, Long userId) {

                UserEntity currentUser = securityService.getCurrentUser();

                TeamTemplateEntity template = teamTemplateRepository
                                .findById(templateId)
                                .orElseThrow(() -> new ResourceNotFoundException("Team template not found"));

                if (!template.getOwner().getId().equals(currentUser.getId())) {
                        throw new ResourceNotFoundException("Team template not found");
                }

                TeamMemberTemplateEntity entity = teamMemberTemplateRepository
                                .findByTeamTemplateIdAndUserId(templateId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));

                entity.setDeletedAt(OffsetDateTime.now());

                teamMemberTemplateRepository.save(entity);
        }

}