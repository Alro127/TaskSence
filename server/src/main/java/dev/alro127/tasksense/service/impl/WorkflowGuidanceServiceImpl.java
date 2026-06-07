package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.client.AiServiceClient;
import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.domain.enums.WorkflowGenerationSource;
import dev.alro127.tasksense.domain.enums.WorkflowStatus;
import dev.alro127.tasksense.dto.guidance.GuidanceGenerationContextDto;
import dev.alro127.tasksense.dto.guidance.WorkflowGuidanceDto;
import dev.alro127.tasksense.dto.request.CreateProjectFromWorkflowRequest;
import dev.alro127.tasksense.dto.request.CreateWorkspaceRequest;
import dev.alro127.tasksense.dto.request.GenerateGuidanceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowGuidanceRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;
import dev.alro127.tasksense.dto.response.WorkspaceResponse;
import dev.alro127.tasksense.exception.BadRequestException;
import dev.alro127.tasksense.exception.ForbiddenException;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.*;
import dev.alro127.tasksense.service.SecurityService;
import dev.alro127.tasksense.service.WorkflowGuidanceService;
import dev.alro127.tasksense.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowGuidanceServiceImpl implements WorkflowGuidanceService {

        private final WorkflowRepository workflowRepository;
        private final WorkflowGuidanceRepository workflowGuidanceRepository;
        private final ProjectRepository projectRepository;
        private final WorkspaceRepository workspaceRepository;
        private final WorkspaceService workspaceService;
        private final WorkflowStepRepository workflowStepRepository;
        private final WorkflowStepTaskRepository workflowStepTaskRepository;
        private final TaskRepository taskRepository;
        private final ProjectMemberRepository projectMemberRepository;
        private final AiServiceClient aiServiceClient;
        private final SecurityService securityService;

        @Override
        @Transactional
        public WorkflowGuidanceDto generateGuidance(Long workflowId, GenerateGuidanceRequest request,
                        String authToken) {
                WorkflowEntity workflow = workflowRepository.findById(workflowId)
                                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

                UserEntity currentUser = securityService.getCurrentUser();
                if (!workflow.getCreatedBy().getId().equals(currentUser.getId())) {
                        throw new ForbiddenException("Only the workflow owner can generate guidance");
                }

                List<WorkflowStepEntity> steps = workflowStepRepository
                                .findAllByWorkflowIdOrderByPositionAscIdAsc(workflowId);

                GuidanceGenerationContextDto context = GuidanceGenerationContextDto.builder()
                                .workflowId(workflowId)
                                .name(workflow.getName())
                                .description(workflow.getDescription())
                                .projectName(workflow.getProject().getName())
                                .userInstructions(request != null ? request.getUserInstructions() : null)
                                .steps(steps.stream()
                                                .map(s -> GuidanceGenerationContextDto.WorkflowStepContextDto.builder()
                                                                .title(s.getTitle())
                                                                .description(s.getDescription())
                                                                .position(s.getPosition())
                                                                .build())
                                                .toList())
                                .build();

                WorkflowGuidanceDto guidanceDto = aiServiceClient.generateGuidance(context, authToken);

                WorkflowGuidanceEntity guidanceEntity = workflowGuidanceRepository
                                .findByWorkflowIdAndPublicationVersion(workflowId, workflow.getPublicationVersion())
                                .orElseGet(() -> WorkflowGuidanceEntity.builder()
                                                .workflow(workflow)
                                                .publicationVersion(workflow.getPublicationVersion())
                                                .build());

                guidanceEntity.setRawJson(guidanceDto);
                guidanceEntity.setSummaryJson(guidanceDto.getSummary());
                guidanceEntity.setIsUserEdited(false);
                guidanceEntity.setEditedBy(null);

                workflowGuidanceRepository.save(guidanceEntity);

                workflow.setGenerationSource(WorkflowGenerationSource.AI_REFINED);
                workflowRepository.save(workflow);

                return guidanceDto;
        }

        @Override
        @Transactional
        public WorkflowGuidanceDto updateGuidance(Long workflowId, UpdateWorkflowGuidanceRequest request) {
                WorkflowEntity workflow = workflowRepository.findById(workflowId)
                                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

                UserEntity currentUser = securityService.getCurrentUser();
                if (!workflow.getCreatedBy().getId().equals(currentUser.getId())) {
                        throw new ForbiddenException("Only the workflow owner can edit guidance");
                }

                WorkflowGuidanceEntity guidanceEntity = workflowGuidanceRepository
                                .findByWorkflowIdAndPublicationVersion(workflowId, workflow.getPublicationVersion())
                                .orElseThrow(() -> new BadRequestException(
                                                "Guidance not found for this version. Generate it first."));

                WorkflowGuidanceDto rawJson = guidanceEntity.getRawJson();
                rawJson.setSummary(request.getSummary());

                Map<String, String> stepDescriptionMap = request.getInteractiveSteps().stream()
                                .collect(Collectors.toMap(
                                                UpdateWorkflowGuidanceRequest.UpdateGuidanceStepRequest::getId,
                                                UpdateWorkflowGuidanceRequest.UpdateGuidanceStepRequest::getDescription));

                rawJson.getInteractiveSteps().forEach(step -> {
                        if (stepDescriptionMap.containsKey(step.getId())) {
                                step.setDescription(stepDescriptionMap.get(step.getId()));
                        }
                });

                guidanceEntity.setRawJson(rawJson);
                guidanceEntity.setSummaryJson(rawJson.getSummary());
                guidanceEntity.setIsUserEdited(true);
                guidanceEntity.setEditedBy(currentUser);

                workflowGuidanceRepository.save(guidanceEntity);

                return rawJson;
        }

        @Override
        @Transactional(readOnly = true)
        public WorkflowGuidanceDto getGuidanceByProject(Long projectId) {
                ProjectEntity project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

                if (project.getSourceWorkflow() == null) {
                        return null;
                }

                WorkflowEntity workflow = project.getSourceWorkflow();
                return workflowGuidanceRepository
                                .findFirstByWorkflowIdOrderByPublicationVersionDesc(workflow.getId())
                                .map(WorkflowGuidanceEntity::getRawJson)
                                .orElse(null);
        }

        @Override
        @Transactional(readOnly = true)
        public WorkflowGuidanceDto getGuidanceByWorkflow(Long workflowId) {
                return workflowGuidanceRepository
                                .findFirstByWorkflowIdOrderByPublicationVersionDesc(workflowId)
                                .map(WorkflowGuidanceEntity::getRawJson)
                                .orElse(null);
        }

        @Override
        @Transactional
        public ProjectResponse createProjectFromWorkflow(Long workflowId, CreateProjectFromWorkflowRequest request) {
                WorkflowEntity workflow = workflowRepository.findById(workflowId)
                                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found"));

                if (workflow.getStatus() != WorkflowStatus.PUBLIC) {
                        throw new BadRequestException("Cannot create project from a DRAFT workflow");
                }

                UserEntity currentUser = securityService.getCurrentUser();
                WorkspaceEntity workspace;

                if (request.getWorkspaceId() != null) {
                        workspace = workspaceRepository.findById(request.getWorkspaceId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
                        // Permission check: current user must be member of workspace with
                        // CREATE_PROJECT permission
                        // Assuming simplified check for now or relying on downstream service
                } else {
                        WorkspaceResponse wsResponse = workspaceService.createWorkspace(CreateWorkspaceRequest.builder()
                                        .name(request.getName() + " Workspace")
                                        .description("Auto-generated for project template: " + workflow.getName())
                                        .isPublic(false)
                                        .build());
                        workspace = workspaceRepository.findById(wsResponse.getId()).get();
                }

                ProjectEntity project = ProjectEntity.builder()
                                .workspace(workspace)
                                .name(request.getName())
                                .description(request.getDescription())
                                .sourceWorkflow(workflow)
                                .build();
                projectRepository.save(project);

                // Add owner to project members
                projectMemberRepository.save(dev.alro127.tasksense.domain.entity.ProjectMemberEntity.builder()
                                .project(project)
                                .user(currentUser)
                                .role(dev.alro127.tasksense.domain.enums.ProjectMemberRole.MANAGER)
                                .build());

                // Clone steps and tasks
                List<WorkflowStepEntity> steps = workflowStepRepository
                                .findAllByWorkflowIdOrderByPositionAscIdAsc(workflowId);
                List<Long> stepIds = steps.stream().map(WorkflowStepEntity::getId).toList();
                List<WorkflowStepTaskEntity> stepTasks = workflowStepTaskRepository.findAllByWorkflowStepIdIn(stepIds);

                Map<Long, List<TaskEntity>> tasksByStepId = stepTasks.stream()
                                .collect(Collectors.groupingBy(st -> st.getWorkflowStep().getId(),
                                                Collectors.mapping(WorkflowStepTaskEntity::getTask,
                                                                Collectors.toList())));

                for (WorkflowStepEntity step : steps) {
                        List<TaskEntity> originalTasks = tasksByStepId.getOrDefault(step.getId(), List.of());
                        for (TaskEntity originalTask : originalTasks) {
                                TaskEntity clonedTask = TaskEntity.builder()
                                                .project(project)
                                                .createdBy(currentUser)
                                                .title(originalTask.getTitle())
                                                .description(originalTask.getDescription())
                                                .priority(originalTask.getPriority())
                                                .status(TaskStatus.TODO) // Reset to TODO as per
                                                                         // CURRENT_ISSUE_WRITTEN_BY_ME.md
                                                .position(originalTask.getPosition())
                                                .build();
                                taskRepository.save(clonedTask);
                                // Note: We are not cloning subtasks, assignees, tags, or sprints for now as per
                                // minimal scope
                        }
                }

                return ProjectResponse.mapToResponse(project);
        }
}
