package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.config.common.AppConfig;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceInviteEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.EmailType;
import dev.alro127.tasksense.domain.enums.InviteStatus;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.dto.message.EmailMessage;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.CreateBulkWorkspaceInviteRequest;
import dev.alro127.tasksense.dto.request.BulkInviteItemRequest;
import dev.alro127.tasksense.dto.response.BulkInviteResult;
import dev.alro127.tasksense.dto.response.WorkspaceInviteResponse;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceInviteRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.security.hash.TokenHasher;
import dev.alro127.tasksense.security.token.TokenProvider;
import dev.alro127.tasksense.service.EmailService;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkspaceInviteService;
import dev.alro127.tasksense.service.publisher.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceInviteServiceImpl implements WorkspaceInviteService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceInviteRepository workspaceInviteRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;
    private final TokenProvider tokenProvider;
    private final TokenHasher tokenHasher;
    private final EmailService emailService;
    private final NotificationPublisher notificationPublisher;


    @Override
    @Transactional
    public WorkspaceInviteResponse inviteMember(Long workspaceId,
                                                BulkInviteItemRequest request) {

        UserEntity currentUser = securityService.getCurrentUser();

        WorkspaceEntity workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            boolean isMember = workspaceMemberRepository
                    .existsByWorkspaceIdAndUserId(workspaceId, user.getId());

            if (isMember) {
                throw new ConflictException("User already member of workspace");
            }
        });

        boolean hasPendingInvite = workspaceInviteRepository
                .existsByWorkspaceIdAndEmailAndStatus(
                        workspaceId,
                        request.getEmail(),
                        InviteStatus.PENDING
                );

        if (hasPendingInvite) {
            throw new ConflictException("User already has pending invite");
        }

        String rawToken = tokenProvider.generate();
        String hashedToken = tokenHasher.hash(rawToken);

        WorkspaceInviteEntity invite = WorkspaceInviteEntity.builder()
                .workspace(workspace)
                .email(request.getEmail())
                .role(request.getRole())
                .token(hashedToken)
                .status(InviteStatus.PENDING)
                .invitedBy(currentUser)
                .invitedAt(OffsetDateTime.now())
                .expiredAt(OffsetDateTime.now().plusDays(7))
                .build();

        workspaceInviteRepository.save(invite);

        emailService.sendWorkspaceInviteEmail(request.getEmail(), rawToken);

        return WorkspaceInviteResponse.mapToResponse(invite);
    }

    @Override
    public List<WorkspaceInviteResponse> getWorkspaceInvites(Long workspaceId) {

        return workspaceInviteRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(WorkspaceInviteResponse::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public WorkspaceInviteResponse acceptInvite(String token) {

        WorkspaceInviteEntity invite = workspaceInviteRepository
                .findByToken(tokenHasher.hash(token))
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found"));

        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new ConflictException("Invite is not pending");
        }

        if (invite.getExpiredAt().isBefore(OffsetDateTime.now())) {
            invite.setStatus(InviteStatus.EXPIRED);
            throw new ForbiddenException("Invite has expired");
        }

        UserEntity user = userRepository.findByEmail(invite.getEmail())
                .orElseThrow(() -> new IllegalStateException("User must register before accepting invite"));

        boolean isMember = workspaceMemberRepository
                .existsByWorkspaceIdAndUserId(
                        invite.getWorkspace().getId(),
                        user.getId()
                );

        if (isMember) {
            invite.setStatus(InviteStatus.ACCEPTED);
            return WorkspaceInviteResponse.mapToResponse(invite);
        }

        WorkspaceMemberEntity member = WorkspaceMemberEntity.builder()
                .workspace(invite.getWorkspace())
                .user(user)
                .role(invite.getRole())
                .joinedAt(OffsetDateTime.now())
                .build();

        workspaceMemberRepository.save(member);

        invite.setStatus(InviteStatus.ACCEPTED);
        invite.setAcceptedAt(OffsetDateTime.now());

        notificationPublisher.publish(NotificationMessage.builder()
                .receiverId(invite.getInvitedBy().getId())
                .actorId(null)
                .type(NotificationType.WORKSPACE_INVITE)
                .referenceType("INVITATION")
                .referenceId(member.getId())
                .payload(null)
                .build());

        return WorkspaceInviteResponse.mapToResponse(invite);
    }

    @Override
    @Transactional
    public void revokeInvite(Long inviteId) {

        WorkspaceInviteEntity invite = workspaceInviteRepository.findById(inviteId)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found"));

        if (invite.getStatus() != InviteStatus.PENDING) {
            throw new ConflictException("Only pending invite can be revoked");
        }

        invite.setStatus(InviteStatus.REVOKED);
    }

    @Override
    public BulkInviteResult inviteMultipleMembers(Long workspaceId,
                                                  CreateBulkWorkspaceInviteRequest request) {

        List<WorkspaceInviteResponse> success = new ArrayList<>();
        List<BulkInviteResult.FailedInvite> failed = new ArrayList<>();

        for (BulkInviteItemRequest item : request.getInvites()) {

            try {

                WorkspaceInviteResponse response =
                        inviteMember(workspaceId, item);

                success.add(response);

            } catch (Exception e) {
                failed.add(BulkInviteResult.FailedInvite.builder()
                        .email(item.getEmail())
                        .reason(e.getMessage())
                        .build());
            }
        }

        return BulkInviteResult.builder()
                .success(success)
                .failed(failed)
                .build();
    }
}