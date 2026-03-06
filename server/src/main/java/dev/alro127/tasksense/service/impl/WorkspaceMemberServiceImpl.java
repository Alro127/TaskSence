package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRoleRequest;
import dev.alro127.tasksense.dto.response.WorkspaceMemberResponse;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkspaceMemberService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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

    @Override
    public List<WorkspaceMemberResponse> getWorkspaceMembers(Long workspaceId) {

        workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new EntityNotFoundException("Workspace not found"));

        return workspaceMemberRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(WorkspaceMemberResponse::mapToResponse)
                .toList();
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

        if (member.getRole() == WorkspaceRole.OWNER ) {
            throw new ConflictException("Workspace have only one owner");
        }

        member.setRole(newRole);

        notificationService.saveAndPublic(NotificationMessage.builder()
                .receiverId(member.getUser().getId())
                .actorId(securityService.getCurrentUserId())
                .type(NotificationType.WORKSPACE_ROLE_CHANGE)
                .referenceType(EntityType.WORKSPACE)
                .referenceId(member.getWorkspace().getId())
                .payload(Map.of("referenceName", member.getWorkspace().getName()))
                .build());

        return WorkspaceMemberResponse.mapToResponse(member);
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

        member.setDeletedAt(OffsetDateTime.now());

        //projectMemberRepository.deleteByWorkspaceIdAndUserId(workspaceId, memberId);
        workspaceMemberRepository.save(member);

        notificationService.saveAndPublic(NotificationMessage.builder()
                .receiverId(member.getUser().getId())
                .actorId(securityService.getCurrentUserId())
                .type(NotificationType.WORKSPACE_REMOVE_MEMBER)
                .referenceType(EntityType.WORKSPACE)
                .referenceId(member.getWorkspace().getId())
                .payload(Map.of("referenceName", member.getWorkspace().getName()))
                .build());
    }
}