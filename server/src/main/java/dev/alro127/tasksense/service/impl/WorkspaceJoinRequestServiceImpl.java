package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceJoinRequestEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.JoinRequestStatus;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.CreateWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewWorkspaceJoinRequest;
import dev.alro127.tasksense.dto.response.WorkspaceJoinRequestResponse;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceJoinRequestRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkspaceJoinRequestService;
import dev.alro127.tasksense.service.WorkspaceMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceJoinRequestServiceImpl implements WorkspaceJoinRequestService {

    private final WorkspaceJoinRequestRepository joinRequestRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberService workspaceMemberService;
    private final UserRepository userRepository;
    private final SecurityService securityService;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final NotificationService notificationService;

    private final EnumMap<JoinRequestStatus, List<JoinRequestStatus>> state =
            new EnumMap<>(JoinRequestStatus.class);

    {
        state.put(
                JoinRequestStatus.PENDING,
                List.of(
                        JoinRequestStatus.APPROVED,
                        JoinRequestStatus.REJECTED,
                        JoinRequestStatus.CANCELLED
                )
        );
    }
    @Override
    @Transactional
    public WorkspaceJoinRequestResponse createJoinRequest(
            Long workspaceId,
            CreateWorkspaceJoinRequest request
    ) {

        Long userId = securityService.getCurrentUserId();

        WorkspaceEntity workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean existsPending = joinRequestRepository
                .existsByWorkspaceIdAndUserIdAndStatus(
                        workspaceId,
                        userId,
                        JoinRequestStatus.PENDING
                );

        if (existsPending) {
            throw new ConflictException("Join request already exists");
        }

        boolean existMember = workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId);

        if (existMember) {
            throw new ConflictException("You are already a member of this workspace");
        }

        WorkspaceJoinRequestEntity entity = WorkspaceJoinRequestEntity.builder()
                .workspace(workspace)
                .user(user)
                .message(request.getMessage())
                .status(JoinRequestStatus.PENDING)
                .build();

        joinRequestRepository.save(entity);

        notificationService.saveAndPublic(NotificationMessage.builder()
                .receiverId(workspace.getOwner().getId())
                .actorId(securityService.getCurrentUserId())
                .type(NotificationType.WORKSPACE_JOIN_REQUEST)
                .referenceType(EntityType.WORKSPACE)
                .referenceId(workspace.getId())
                .payload(Map.of("referenceName", workspace.getName()))
                .build());

        return WorkspaceJoinRequestResponse.mapToResponse(entity);
    }

    @Override
    public List<WorkspaceJoinRequestResponse> getWorkspaceJoinRequests(Long workspaceId) {

        Long currentUserId = securityService.getCurrentUserId();

        WorkspaceMemberEntity member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, currentUserId)
                .orElseThrow(() -> new ForbiddenException("You aren't a member of this workspace"));

        if (member.getRole() != WorkspaceRole.OWNER && member.getRole() != WorkspaceRole.MANAGER) {
            throw new ForbiddenException("You don't have permission to do this action");
        }

        List<WorkspaceJoinRequestEntity> requests =
                joinRequestRepository.findByWorkspaceId(workspaceId);

        return requests.stream()
                .map(WorkspaceJoinRequestResponse::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WorkspaceJoinRequestResponse reviewJoinRequest(
            Long requestId,
            ReviewWorkspaceJoinRequest request
    ) {

        WorkspaceJoinRequestEntity entity = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found"));

        var allowState = state.get(entity.getStatus());
        if (!allowState.contains(request.getStatus())) {
            throw new ConflictException("Join request already reviewed");
        }

        Long reviewerId = securityService.getCurrentUserId();

        UserEntity reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found"));

        WorkspaceMemberEntity member = workspaceMemberRepository.findByWorkspaceIdAndUserId(entity.getWorkspace().getId(), reviewerId)
                .orElseThrow(() -> new ForbiddenException("You aren't a member of this workspace"));

        if (member.getRole() != WorkspaceRole.OWNER && member.getRole() != WorkspaceRole.MANAGER) {
            throw new ForbiddenException("You don't have permission to do this action");
        }

        JoinRequestStatus status = request.getStatus();

        entity.setStatus(status);
        entity.setReviewedBy(reviewer);
        entity.setReviewedAt(OffsetDateTime.now());

        joinRequestRepository.save(entity);

        NotificationMessage message = NotificationMessage.builder()
                .receiverId(entity.getUser().getId())
                .actorId(securityService.getCurrentUserId())
                .type(NotificationType.WORKSPACE_REVIEW_REQUEST)
                .referenceType(EntityType.WORKSPACE)
                .payload(Map.of("referenceName", entity.getWorkspace().getName()))
                .build();

        if (status == JoinRequestStatus.APPROVED) {
            workspaceMemberService.addUserToWorkspace(entity.getWorkspace().getId(), entity.getUser().getId());
            message.setReferenceId(entity.getWorkspace().getId());
        }

        notificationService.saveAndPublic(message);

        return WorkspaceJoinRequestResponse.mapToResponse(entity);
    }

    @Override
    @Transactional
    public WorkspaceJoinRequestResponse cancelJoinRequest(Long requestId) {

        WorkspaceJoinRequestEntity entity = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found"));

        Long userId = securityService.getCurrentUserId();

        if (!entity.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You cannot cancel this request");
        }

        var allowState = state.get(entity.getStatus());
        if (!allowState.contains(JoinRequestStatus.CANCELLED)) {
            throw new ConflictException("Join request already reviewed");
        }

        entity.setStatus(JoinRequestStatus.CANCELLED);

        joinRequestRepository.save(entity);

        return WorkspaceJoinRequestResponse.mapToResponse(entity);
    }
}


