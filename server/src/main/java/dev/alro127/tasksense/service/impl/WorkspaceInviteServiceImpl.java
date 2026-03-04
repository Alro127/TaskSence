package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.config.common.AppConfig;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceInviteEntity;
import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.InviteStatus;
import dev.alro127.tasksense.dto.message.EmailMessage;
import dev.alro127.tasksense.dto.request.CreateWorkspaceInviteRequest;
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
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkspaceInviteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.awt.*;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

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
    private final StringRedisTemplate stringRedisTemplate;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AppConfig appConfig;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public WorkspaceInviteResponse inviteMember(Long workspaceId,
                                                CreateWorkspaceInviteRequest request) {

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

        System.out.println(rawToken);

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

        String invitationLink = appConfig.getFrontendUrl() + "/workspaces/invitation?token=" + rawToken;

        String htmlContent = """
                <div style="font-family: Arial, sans-serif;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your password.</p>
                    <p>Click the button below to reset it:</p>

                    <div style="text-align:center; margin:20px 0;">
                        <a href="%s"
                           style="
                             background-color:#4CAF50;
                             color:white;
                             padding:12px 24px;
                             text-decoration:none;
                             border-radius:6px;
                             display:inline-block;
                             font-weight:bold;">
                           Join our workspace
                        </a>
                    </div>

                    <p>If the button doesn’t work, copy this link:</p>
                    <p>%s</p>

                    <p>This link will expire in 15 minutes.</p>
                </div>
                """.formatted(invitationLink, invitationLink);

        EmailMessage message = new EmailMessage(
                request.getEmail(),
                "Invitation to join in our workspace",
                htmlContent);

        try {
            String json = objectMapper.writeValueAsString(message);
            redisTemplate.convertAndSend("invitation-email-channel", json);

        } catch (Exception e) {
            throw new RuntimeException("Failed to publish email message", e);
        }

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
}