package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.MemberAddStatus;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.dto.request.AddProjectMemberRequest;
import dev.alro127.tasksense.dto.request.ProjectMemberItem;
import dev.alro127.tasksense.dto.request.UpdateProjectMemberRoleRequest;
import dev.alro127.tasksense.dto.response.AddProjectMemberResultItem;
import dev.alro127.tasksense.dto.response.ProjectMemberResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.service.ProjectMemberService;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectMemberServiceImpl implements ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    @Override
    @Transactional
    public List<AddProjectMemberResultItem> addMembers(Long projectId, AddProjectMemberRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectManagerAccess(project, currentUser.getId());

        List<ProjectMemberItem> items = request.getMembers();
        List<Long> userIds = items.stream().map(ProjectMemberItem::getUserId).toList();

        List<UserEntity> foundUsers = userRepository.findAllById(userIds);
        Set<Long> foundUserIds = foundUsers.stream()
                .map(UserEntity::getId)
                .collect(Collectors.toSet());

        Map<Long, UserEntity> userMap = foundUsers.stream()
                .collect(Collectors.toMap(UserEntity::getId, u -> u));

        List<ProjectMemberEntity> existingMembers = projectMemberRepository.findAllByProjectId(projectId);
        Map<Long, ProjectMemberEntity> existingMap = existingMembers.stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), m -> m));

        List<ProjectMemberEntity> toSave = new ArrayList<>();
        List<AddProjectMemberResultItem> results = new ArrayList<>();

        for (ProjectMemberItem item : items) {
            Long userId = item.getUserId();
            ProjectMemberRole role = item.getRole();

            if (!foundUserIds.contains(userId)) {
                results.add(AddProjectMemberResultItem.builder()
                        .userId(userId)
                        .role(role)
                        .status(MemberAddStatus.NOT_FOUND)
                        .build());
                continue;
            }

            if (existingMap.containsKey(userId)) {
                results.add(AddProjectMemberResultItem.builder()
                        .userId(userId)
                        .role(role)
                        .status(MemberAddStatus.ALREADY_EXISTS)
                        .build());
                continue;
            }

            ProjectMemberEntity entity = ProjectMemberEntity.builder()
                    .project(project)
                    .user(userMap.get(userId))
                    .role(role)
                    .build();

            toSave.add(entity);
            results.add(AddProjectMemberResultItem.builder()
                    .userId(userId)
                    .role(role)
                    .status(MemberAddStatus.CREATED)
                    .build());
        }

        if (!toSave.isEmpty()) {
            projectMemberRepository.saveAll(toSave);
        }

        return results;
    }

    @Override
    public List<ProjectMemberResponse> getMembers(Long projectId) {
        UserEntity currentUser = securityService.getCurrentUser();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectAccess(project, currentUser.getId());

        return projectMemberRepository.findAllByProjectId(projectId)
                .stream()
                .map(ProjectMemberResponse::mapToResponse)
                .toList();
    }

    @Override
    public ProjectMemberResponse updateMemberRole(Long projectId, Long userId, UpdateProjectMemberRoleRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectManagerAccess(project, currentUser.getId());

        ProjectMemberEntity member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));

        member.setRole(request.getRole());
        projectMemberRepository.save(member);

        return ProjectMemberResponse.mapToResponse(member);
    }

    @Override
    @Transactional
    public void removeMember(Long projectId, Long userId) {
        UserEntity currentUser = securityService.getCurrentUser();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectManagerAccess(project, currentUser.getId());

        ProjectMemberEntity member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));

        member.setDeletedAt(OffsetDateTime.now());
        projectMemberRepository.save(member);
    }

    @Override
    public String getCurrentUserRole(Long projectId) {
        UserEntity currentUser = securityService.getCurrentUser();

        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        ProjectMemberEntity member = projectMemberRepository
                .findByProjectIdAndUserId(projectId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this project"));

        return member.getRole().name();
    }

    // ---- helpers ----

    private void validateProjectAccess(ProjectEntity project, Long userId) {
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(project.getId(), userId);
        if (!isMember) {
            throw new UnauthorizedException("Access denied");
        }
    }

    private void validateProjectManagerAccess(ProjectEntity project, Long userId) {
        boolean isProjectManager = projectMemberRepository.existsByProjectIdAndUserIdAndRole(
                project.getId(), userId, ProjectMemberRole.PROJECT_MANAGER);
        if (!isProjectManager) {
            throw new UnauthorizedException("Access denied");
        }
    }
}
