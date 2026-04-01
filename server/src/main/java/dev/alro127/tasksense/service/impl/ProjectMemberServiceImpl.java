package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.MemberAddStatus;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.AddProjectMemberRequest;
import dev.alro127.tasksense.dto.request.ProjectMemberItem;
import dev.alro127.tasksense.dto.request.UpdateProjectMemberRoleRequest;
import dev.alro127.tasksense.dto.response.AddProjectMemberResultItem;
import dev.alro127.tasksense.dto.response.ProjectMemberResponse;
import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.security.permission.EffectivePermissionResolver;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.ProjectMemberService;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        private final WorkspaceMemberRepository workspaceMemberRepository;
        private final ProjectMemberRepository projectMemberRepository;
        private final ProjectRepository projectRepository;
        private final UserRepository userRepository;
        private final SecurityService securityService;
        private final NotificationService notificationService;
        private final EffectivePermissionResolver permissionResolver;

        @Override
        @Transactional
        public List<AddProjectMemberResultItem> addMembers(Long projectId, AddProjectMemberRequest request) {
                // @PreAuthorize đã kiểm tra MANAGE_MEMBERS permission

                ProjectEntity project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

                List<ProjectMemberItem> items = request.getMembers();
                List<Long> userIds = items.stream().map(ProjectMemberItem::getUserId).toList();

                List<UserEntity> foundUsers = userRepository.findAllById(userIds);
                Set<Long> foundUserIds = foundUsers.stream()
                                .map(UserEntity::getId)
                                .collect(Collectors.toSet());

                Map<Long, UserEntity> userMap = foundUsers.stream()
                                .collect(Collectors.toMap(UserEntity::getId, u -> u));

                Map<Long, ProjectMemberEntity> existingProjectMembers = projectMemberRepository
                                .findByProjectIdAndUserIdIn(projectId, userIds).stream()
                                .collect(Collectors.toMap(m -> m.getUser().getId(), m -> m));

                Long workspaceId = project.getWorkspace().getId();

                List<WorkspaceMemberEntity> workspaceMembers = workspaceMemberRepository
                                .findByWorkspaceIdAndUserIdIn(workspaceId, userIds);

                Set<Long> workspaceUserIds = workspaceMembers.stream()
                                .map(m -> m.getUser().getId())
                                .collect(Collectors.toSet());

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
                        if (!workspaceUserIds.contains(userId)) {
                                results.add(AddProjectMemberResultItem.builder()
                                                .userId(userId)
                                                .role(role)
                                                .status(MemberAddStatus.NOT_IN_WORKSPACE)
                                                .build());
                                continue;
                        }

                        if (existingProjectMembers.containsKey(userId)) {
                                results.add(AddProjectMemberResultItem.builder()
                                                .userId(userId)
                                                .role(role)
                                                .status(MemberAddStatus.ALREADY_EXISTS)
                                                .build());
                                continue;
                        }

                        // Reactivate soft-deleted member or create new
                        ProjectMemberEntity entity = existingProjectMembers.get(userId);

                        if (entity == null) {
                                entity = ProjectMemberEntity.builder()
                                                .project(project)
                                                .user(userMap.get(userId))
                                                .build();
                        }

                        entity.setRole(role);
                        entity.setDeletedAt(null);

                        toSave.add(entity);
                        results.add(AddProjectMemberResultItem.builder()
                                        .userId(userId)
                                        .role(role)
                                        .status(MemberAddStatus.CREATED)
                                        .build());
                }

                if (!toSave.isEmpty()) {
                        projectMemberRepository.saveAll(toSave);
                        permissionResolver.evictAllPermissionCache();
                }

                for (AddProjectMemberResultItem r : results) {
                        notificationService.saveAndPublish(NotificationMessage.builder()
                                .receiverId(r.getUserId())
                                .actorId(securityService.getCurrentUserId())
                                .type(NotificationType.PROJECT_ADD_MEMBER)
                                .referenceType(EntityType.PROJECT)
                                .referenceId(projectId)
                                .payload(Map.of("referenceName", project.getName()))
                                .build());
                }

                return results;
        }

        @Override
        public PageResponse<ProjectMemberResponse> getMembers(Long projectId, Pageable pageable) {
                // @PreAuthorize đã kiểm tra VIEW_MEMBERS permission

                Long currentUserId = securityService.getCurrentUserId();
                var currentUserPermissions = permissionResolver.resolveProjectPermissions(currentUserId, projectId);

                Page<ProjectMemberResponse> responsePage = projectMemberRepository
                                .findAllByProjectId(projectId, pageable)
                                .map(entity -> {
                                        ProjectMemberResponse response = ProjectMemberResponse.mapToResponse(entity);
                                        response.setPermissions(currentUserPermissions);
                                        return response;
                                });
                return new PageResponse<>(
                                responsePage.getContent(),
                                responsePage.getNumber(),
                                responsePage.getSize(),
                                responsePage.getTotalElements(),
                                responsePage.getTotalPages());
        }

        @Override
        public ProjectMemberResponse updateMemberRole(Long projectId, Long userId,
                        UpdateProjectMemberRoleRequest request) {
                // @PreAuthorize đã kiểm tra MANAGE_MEMBERS permission

                ProjectEntity project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

                ProjectMemberEntity member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));

                member.setRole(request.getRole());
                projectMemberRepository.save(member);
                permissionResolver.evictAllPermissionCache();

                Long currentUserId = securityService.getCurrentUserId();
                ProjectMemberResponse response = ProjectMemberResponse.mapToResponse(member);
                response.setPermissions(permissionResolver.resolveProjectPermissions(currentUserId, projectId));

                notificationService.saveAndPublish(NotificationMessage.builder()
                        .receiverId(userId)
                        .actorId(securityService.getCurrentUserId())
                        .type(NotificationType.PROJECT_ROLE_CHANGE)
                        .referenceType(EntityType.PROJECT)
                        .referenceId(projectId)
                        .payload(Map.of("referenceName", project.getName()))
                        .build());

                return response;
        }

        @Override
        @Transactional
        public void removeMember(Long projectId, Long userId) {
                // @PreAuthorize đã kiểm tra MANAGE_MEMBERS permission

                ProjectEntity project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

                ProjectMemberEntity member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Project member not found"));

                if (member.getRole() == ProjectMemberRole.MANAGER) {
                        throw new BadRequestException("Cannot remove a manager from the project.");
                }

                member.setDeletedAt(OffsetDateTime.now());
                projectMemberRepository.save(member);
                permissionResolver.evictAllPermissionCache();

                notificationService.saveAndPublish(NotificationMessage.builder()
                        .receiverId(userId)
                        .actorId(securityService.getCurrentUserId())
                        .type(NotificationType.PROJECT_REMOVE_MEMBER)
                        .referenceType(EntityType.PROJECT)
                        .referenceId(projectId)
                        .payload(Map.of("referenceName", project.getName()))
                        .build());
        }

        @Override
        @Transactional
        public void leaveProject(Long projectId) {
                UserEntity currentUser = securityService.getCurrentUser();

                ProjectMemberEntity member = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this project"));

                if (member.getRole() == ProjectMemberRole.MANAGER) {
                        long managerCount = projectMemberRepository.countByProjectIdAndRole(projectId, ProjectMemberRole.MANAGER);
                        if (managerCount <= 1) {
                                throw new ConflictException("Cannot leave: you are the only project manager. Transfer the role first.");
                        }
                }

                member.setDeletedAt(OffsetDateTime.now());
                projectMemberRepository.save(member);
                permissionResolver.evictAllPermissionCache();

                projectMemberRepository.findAllByProjectIdAndRole(projectId, ProjectMemberRole.MANAGER).stream()
                                .filter(m -> !m.getUser().getId().equals(currentUser.getId()))
                                .forEach(m -> notificationService.saveAndPublish(NotificationMessage.builder()
                                                .receiverId(m.getUser().getId())
                                                .actorId(currentUser.getId())
                                                .type(NotificationType.PROJECT_LEAVE)
                                                .referenceType(EntityType.PROJECT)
                                                .referenceId(projectId)
                                                .payload(Map.of("actorName", currentUser.getFullName(),"referenceName", member.getProject().getName()))
                                                .build()));
        }

        @Override
        public String getCurrentUserRole(Long projectId) {
                UserEntity currentUser = securityService.getCurrentUser();

                ProjectMemberEntity member = projectMemberRepository
                                .findByProjectIdAndUserId(projectId, currentUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "You are not a member of this project"));

                return member.getRole().name();
        }
}
