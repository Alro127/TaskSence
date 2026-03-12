package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.ProjectJoinRequestEntity;
import dev.alro127.tasksense.domain.entity.ProjectMemberEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.EntityType;
import dev.alro127.tasksense.domain.enums.JoinRequestStatus;
import dev.alro127.tasksense.domain.enums.NotificationType;
import dev.alro127.tasksense.domain.enums.ProjectMemberRole;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.message.NotificationMessage;
import dev.alro127.tasksense.dto.request.ProjectJoinRequest;
import dev.alro127.tasksense.dto.request.ReviewProjectJoinRequest;
import dev.alro127.tasksense.dto.response.ProjectJoinRequestResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.exception.UnauthorizedException;
import dev.alro127.tasksense.repository.jpa.ProjectJoinRequestRepository;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.service.NotificationService;
import dev.alro127.tasksense.service.ProjectJoinRequestService;
import dev.alro127.tasksense.service.SecurityService;
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
public class ProjectJoinRequestServiceImpl implements ProjectJoinRequestService {

    private final ProjectJoinRequestRepository projectJoinRequestRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final SecurityService securityService;
    private final NotificationService notificationService;

    @Override
    public ProjectJoinRequestResponse sendJoinRequest(Long projectId, ProjectJoinRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUser.getId())) {
            throw new ConflictException("You are already a member of this project");
        }

        if (projectJoinRequestRepository.existsByProjectIdAndUserIdAndStatus(
                projectId, currentUser.getId(), JoinRequestStatus.PENDING)) {
            throw new ConflictException("You already have a pending join request for this project");
        }

        ProjectJoinRequestEntity joinRequest = ProjectJoinRequestEntity.builder()
                .project(project)
                .user(currentUser)
                .message(request.getMessage())
                .status(JoinRequestStatus.PENDING)
                .build();

        projectJoinRequestRepository.save(joinRequest);
        ProjectMemberEntity manager = projectMemberRepository
                .findByProjectIdAndRole(projectId, ProjectMemberRole.MANAGER)
                .orElseThrow(() -> new ResourceNotFoundException("Project manager not found"));

        notificationService.saveAndPublish(NotificationMessage.builder()
                .receiverId(manager.getUser().getId())
                .actorId(securityService.getCurrentUserId())
                .type(NotificationType.PROJECT_JOIN_REQUEST)
                .referenceType(EntityType.INVITATION)
                .referenceId(projectId)
                .payload(Map.of("referenceName", project.getName()))
                .build());

        return ProjectJoinRequestResponse.mapToResponse(joinRequest);
    }

    @Override
    public PageResponse<ProjectJoinRequestResponse> getJoinRequests(Long projectId, Pageable pageable) {
        UserEntity currentUser = securityService.getCurrentUser();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectManagerAccess(project, currentUser.getId());

        Page<ProjectJoinRequestResponse> responsePage = projectJoinRequestRepository
                .findAllByProjectIdAndStatus(projectId, JoinRequestStatus.PENDING, pageable)
                .map(ProjectJoinRequestResponse::mapToResponse);

        return new PageResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages());
    }

    @Override
    @Transactional
    public ProjectJoinRequestResponse reviewJoinRequest(Long projectId, Long requestId,
            ReviewProjectJoinRequest request) {
        UserEntity currentUser = securityService.getCurrentUser();

        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        validateProjectManagerAccess(project, currentUser.getId());

        ProjectJoinRequestEntity joinRequest = projectJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found"));

        if (!joinRequest.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Join request not found");
        }

        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BadRequestException("Join request is no longer pending");
        }

        JoinRequestStatus newStatus = request.getStatus();

        if (newStatus != JoinRequestStatus.APPROVED && newStatus != JoinRequestStatus.REJECTED) {
            throw new BadRequestException("Status must be APPROVED or REJECTED");
        }

        joinRequest.setStatus(newStatus);
        joinRequest.setReviewedBy(currentUser);
        joinRequest.setReviewedAt(OffsetDateTime.now());
        projectJoinRequestRepository.save(joinRequest);

        if (newStatus == JoinRequestStatus.APPROVED) {
            ProjectMemberEntity member = ProjectMemberEntity.builder()
                    .project(project)
                    .user(joinRequest.getUser())
                    .role(ProjectMemberRole.MEMBER)
                    .build();
            projectMemberRepository.save(member);
        }

        notificationService.saveAndPublish(NotificationMessage.builder()
                .receiverId(joinRequest.getUser().getId())
                .actorId(securityService.getCurrentUserId())
                .type(NotificationType.PROJECT_JOIN_REQUEST)
                .referenceType(EntityType.INVITATION)
                .referenceId(projectId)
                .payload(Map.of("referenceName", project.getName()))
                .build());

        return ProjectJoinRequestResponse.mapToResponse(joinRequest);
    }

    @Override
    public void cancelJoinRequest(Long projectId, Long requestId) {
        UserEntity currentUser = securityService.getCurrentUser();

        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        ProjectJoinRequestEntity joinRequest = projectJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found"));

        if (!joinRequest.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Join request not found");
        }

        if (!joinRequest.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied");
        }

        if (joinRequest.getStatus() != JoinRequestStatus.PENDING) {
            throw new BadRequestException("Only pending requests can be cancelled");
        }

        joinRequest.setStatus(JoinRequestStatus.CANCELLED);
        projectJoinRequestRepository.save(joinRequest);
    }

    // ---- helpers ----

    private void validateProjectManagerAccess(ProjectEntity project, Long userId) {
        boolean isProjectManager = projectMemberRepository.existsByProjectIdAndUserIdAndRole(
                project.getId(), userId, ProjectMemberRole.MANAGER);
        if (!isProjectManager) {
            throw new UnauthorizedException("Access denied");
        }
    }
}
