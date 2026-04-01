package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRoleRequest;
import dev.alro127.tasksense.dto.response.WorkspaceMemberResponse;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.security.permission.EffectivePermissionResolver;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkspaceMemberService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkspaceMemberServiceImpl implements WorkspaceMemberService {

        private final WorkspaceMemberRepository workspaceMemberRepository;
        private final WorkspaceRepository workspaceRepository;
        private final ProjectMemberRepository projectMemberRepository;
        private final NotificationService notificationService;
        private final SecurityService securityService;
        private final UserRepository userRepository;
        private final EffectivePermissionResolver permissionResolver;

        @Override
        public PageResponse<WorkspaceMemberResponse> getWorkspaceMembers(Long workspaceId, Pageable pageable) {

                workspaceRepository.findById(workspaceId)
                                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

                Long currentUserId = securityService.getCurrentUserId();
                var currentUserPermissions = permissionResolver.resolveWorkspacePermissions(currentUserId, workspaceId);

                Page<WorkspaceMemberResponse> responsePage = workspaceMemberRepository
                                .findByWorkspaceId(workspaceId, pageable)
                                .map(entity -> {
                                        WorkspaceMemberResponse response = WorkspaceMemberResponse
                                                        .mapToResponse(entity);
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
        @Transactional
        public void addUserToWorkspace(Long workspaceId, Long userId) {

                WorkspaceEntity workspace = workspaceRepository.findById(workspaceId).orElseThrow(
                                () -> new ResourceNotFoundException("Workspace not found"));

                UserEntity user = userRepository.findById(userId).orElseThrow(
                                () -> new ResourceNotFoundException("User not found"));

                WorkspaceMemberEntity member = workspaceMemberRepository
                                .findByWorkspaceIdAndUserIdIgnoreRestriction(workspaceId, userId)
                                .orElse(WorkspaceMemberEntity.builder()
                                                .workspace(workspace)
                                                .user(user)
                                                .role(WorkspaceRole.MEMBER)
                                                .joinedAt(OffsetDateTime.now())
                                                .build());
                member.setDeletedAt(null);
                member.setRole(WorkspaceRole.MEMBER);

                workspaceMemberRepository.save(member);
                permissionResolver.evictAllPermissionCache();
        }

        @Override
        @Transactional
        public WorkspaceMemberResponse updateMemberRole(Long workspaceId,
                        Long memberId,
                        UpdateWorkspaceRoleRequest request) {

                WorkspaceMemberEntity member = workspaceMemberRepository
                                .findByIdAndWorkspaceId(memberId, workspaceId)
                                .orElseThrow(() -> new ResourceNotFoundException("Member not found in workspace"));

                WorkspaceRole newRole = request.getRole();

                if (member.getRole() == WorkspaceRole.OWNER) {
                        throw new ConflictException("Owner can not change their role");
                }
                if (newRole == WorkspaceRole.OWNER) {
                        throw new BadRequestException("Can not change current into Owner");
                }

                member.setRole(newRole);
                permissionResolver.evictAllPermissionCache();

                notificationService.saveAndPublish(NotificationMessage.builder()
                                .receiverId(member.getUser().getId())
                                .actorId(securityService.getCurrentUserId())
                                .type(NotificationType.WORKSPACE_ROLE_CHANGE)
                                .referenceType(EntityType.WORKSPACE)
                                .referenceId(member.getWorkspace().getId())
                                .payload(Map.of("referenceName", member.getWorkspace().getName()))
                                .build());

                Long currentUserId = securityService.getCurrentUserId();
                WorkspaceMemberResponse response = WorkspaceMemberResponse.mapToResponse(member);
                response.setPermissions(permissionResolver.resolveWorkspacePermissions(currentUserId, workspaceId));
                return response;
        }

        @Override
        @Transactional
        public void removeMember(Long workspaceId, Long memberId) {

                WorkspaceMemberEntity member = workspaceMemberRepository
                                .findByIdAndWorkspaceId(memberId, workspaceId)
                                .orElseThrow(() -> new ResourceNotFoundException("Member not found in workspace"));

                if (member.getRole() == WorkspaceRole.OWNER) {

                        long ownerCount = workspaceMemberRepository
                                        .countByWorkspaceIdAndRole(workspaceId, WorkspaceRole.OWNER);

                        if (ownerCount <= 1) {
                                throw new ConflictException("Cannot remove the last workspace owner");
                        }
                }
                OffsetDateTime now = OffsetDateTime.now();

                member.setDeletedAt(now);

                projectMemberRepository.softDeleteByWorkspaceIdAndUserId(workspaceId, member.getUser().getId(), now);
                workspaceMemberRepository.save(member);
                permissionResolver.evictAllPermissionCache();

                notificationService.saveAndPublish(NotificationMessage.builder()
                                .receiverId(member.getUser().getId())
                                .actorId(securityService.getCurrentUserId())
                                .type(NotificationType.WORKSPACE_REMOVE_MEMBER)
                                .referenceType(EntityType.WORKSPACE)
                                .referenceId(member.getWorkspace().getId())
                                .payload(Map.of("referenceName", member.getWorkspace().getName()))
                                .build());
        }

        @Override
        @Transactional
        public void leaveWorkspace(Long workspaceId) {
                UserEntity currentUser = securityService.getCurrentUser();

                WorkspaceMemberEntity member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUser.getId())
                                .orElseThrow(() -> new ResourceNotFoundException("You are not a member of this workspace"));

                if (member.getRole() == WorkspaceRole.OWNER) {
                        long ownerCount = workspaceMemberRepository.countByWorkspaceIdAndRole(workspaceId, WorkspaceRole.OWNER);
                        if (ownerCount <= 1) {
                                throw new ConflictException("Cannot leave: you are the only workspace owner.");
                        }
                }

                OffsetDateTime now = OffsetDateTime.now();
                member.setDeletedAt(now);
                projectMemberRepository.softDeleteByWorkspaceIdAndUserId(workspaceId, currentUser.getId(), now);
                workspaceMemberRepository.save(member);
                permissionResolver.evictAllPermissionCache();

                workspaceMemberRepository
                                .findByWorkspaceIdAndRoleIn(workspaceId, List.of(WorkspaceRole.OWNER, WorkspaceRole.MANAGER))
                                .stream()
                                .filter(m -> !m.getUser().getId().equals(currentUser.getId()))
                                .forEach(m -> notificationService.saveAndPublish(NotificationMessage.builder()
                                                .receiverId(m.getUser().getId())
                                                .actorId(currentUser.getId())
                                                .type(NotificationType.WORKSPACE_LEAVE)
                                                .referenceType(EntityType.WORKSPACE)
                                                .referenceId(workspaceId)
                                                .payload(Map.of("actorName", currentUser.getFullName(), "referenceName", member.getWorkspace().getName()))
                                                .build()));
        }
}