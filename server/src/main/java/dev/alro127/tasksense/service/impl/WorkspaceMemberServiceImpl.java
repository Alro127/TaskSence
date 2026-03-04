package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.WorkspaceMemberEntity;
import dev.alro127.tasksense.domain.enums.WorkspaceRole;
import dev.alro127.tasksense.dto.request.UpdateWorkspaceRoleRequest;
import dev.alro127.tasksense.dto.response.WorkspaceMemberResponse;
import dev.alro127.tasksense.exception.ConflictException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceRepository;
import dev.alro127.tasksense.service.WorkspaceMemberService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceMemberServiceImpl implements WorkspaceMemberService {

    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceRepository workspaceRepository;

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

        if (member.getRole() == WorkspaceRole.OWNER
                && newRole != WorkspaceRole.OWNER) {

            long ownerCount = workspaceMemberRepository
                    .countByWorkspaceIdAndRole(workspaceId, WorkspaceRole.OWNER);

            if (ownerCount <= 1) {
                throw new ConflictException("Cannot downgrade the last workspace owner");
            }
        }

        member.setRole(newRole);

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

        workspaceMemberRepository.delete(member);
    }
}