package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.dto.guidance.WorkflowGuidanceDto;
import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.domain.enums.GuidanceConditionType;
import dev.alro127.tasksense.dto.guidance.GuidanceStepDto;
import dev.alro127.tasksense.exception.ResourceNotFoundException;
import dev.alro127.tasksense.repository.jpa.ProjectGuidanceProgressRepository;
import dev.alro127.tasksense.repository.jpa.ProjectGuidanceTargetRepository;
import dev.alro127.tasksense.repository.jpa.ProjectRepository;
import dev.alro127.tasksense.repository.jpa.WorkflowGuidanceRepository;
import dev.alro127.tasksense.service.ProjectGuidanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectGuidanceServiceImpl implements ProjectGuidanceService {

    private final ProjectGuidanceProgressRepository progressRepository;
    private final ProjectGuidanceTargetRepository targetRepository;
    private final ProjectRepository projectRepository;
    private final WorkflowGuidanceRepository workflowGuidanceRepository;

    @Override
    @Transactional
    public ProjectGuidanceProgressEntity startGuidance(Long projectId, Long workflowId, boolean force) {
        ProjectEntity project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        // Get the latest guidance for the workflow
        WorkflowGuidanceEntity workflowGuidance = workflowGuidanceRepository
                .findFirstByWorkflowIdOrderByPublicationVersionDesc(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Guidance not found for this workflow"));

        if (force) {
            progressRepository.findByProjectId(projectId).ifPresent(progress -> {
                targetRepository.deleteAll(targetRepository.findAllByProgressId(progress.getId()));
                progressRepository.delete(progress);
                progressRepository.flush();
            });
            return initializeProgress(project, workflowGuidance);
        }

        // If progress already exists, return it
        return progressRepository.findByProjectId(projectId)
                .orElseGet(() -> initializeProgress(project, workflowGuidance));
    }

    private ProjectGuidanceProgressEntity initializeProgress(ProjectEntity project,
            WorkflowGuidanceEntity workflowGuidance) {
        ProjectGuidanceProgressEntity progress = ProjectGuidanceProgressEntity.builder()
                .project(project)
                .workflowGuidance(workflowGuidance)
                .currentStepId(workflowGuidance.getRawJson().getInteractiveSteps().get(0).getId())
                .build();

        final ProjectGuidanceProgressEntity savedProgress = progressRepository.save(progress);

        // Initialize targets for each step
        workflowGuidance.getRawJson().getInteractiveSteps().forEach(step -> {
            ProjectGuidanceTargetEntity target = ProjectGuidanceTargetEntity.builder()
                    .progress(savedProgress)
                    .stepId(step.getId())
                    .targetType(step.getCompletionCondition().getType().name())
                    .requiredCount(
                            step.getCompletionCondition().getCount() != null ? step.getCompletionCondition().getCount()
                                    : 1)
                    .currentCount(0)
                    .isCompleted(false)
                    .build();
            targetRepository.save(target);
        });

        return savedProgress;
    }

    @Override
    @Transactional
    public void reportAction(Long projectId, GuidanceConditionType actionType, Map<String, Object> metadata) {
        log.info("[guidance-progress] reporting action {} for projectId {}", actionType, projectId);
        progressRepository.findByProjectId(projectId).ifPresent(progress -> {
            if (!progress.getIsActive())
                return;

            List<GuidanceStepDto> allSteps = progress.getWorkflowGuidance().getRawJson().getInteractiveSteps();
            List<ProjectGuidanceTargetEntity> allTargets = targetRepository.findAllByProgressId(progress.getId());

            boolean progressChanged = false;

            if (actionType == GuidanceConditionType.MANUAL) {
                // Manual actions ONLY complete the current step, and ONLY if it's a MANUAL step
                String currentStepId = progress.getCurrentStepId();
                Optional<ProjectGuidanceTargetEntity> targetOpt = allTargets.stream()
                        .filter(t -> t.getStepId().equals(currentStepId) && !t.getIsCompleted())
                        .findFirst();

                if (targetOpt.isPresent() && targetOpt.get().getTargetType().equals(GuidanceConditionType.MANUAL.name())) {
                    completeTarget(targetOpt.get(), progress);
                    progressChanged = true;
                }
            } else {
                // For non-manual actions (like TASK_CREATED), we find the FIRST incomplete target 
                // of that type in the workflow sequence.
                for (GuidanceStepDto step : allSteps) {
                    if (progress.getCompletedStepIds().contains(step.getId())) {
                        continue;
                    }

                    if (step.getCompletionCondition().getType().name().equals(actionType.name())) {
                        Optional<ProjectGuidanceTargetEntity> targetOpt = allTargets.stream()
                                .filter(t -> t.getStepId().equals(step.getId()) && !t.getIsCompleted())
                                .findFirst();

                        if (targetOpt.isPresent()) {
                            completeTarget(targetOpt.get(), progress);
                            progressChanged = true;
                            // We only complete ONE target per report call to maintain sequence
                            break;
                        }
                    }
                }
            }

            if (progressChanged) {
                updateCurrentStep(progress);
                progressRepository.save(progress);
            }
        });
    }

    private void completeTarget(ProjectGuidanceTargetEntity target, ProjectGuidanceProgressEntity progress) {
        target.setCurrentCount(target.getCurrentCount() + 1);
        if (target.getCurrentCount() >= target.getRequiredCount()) {
            target.setIsCompleted(true);
            progress.getCompletedStepIds().add(target.getStepId());
        }
        targetRepository.save(target);
    }

    private void updateCurrentStep(ProjectGuidanceProgressEntity progress) {
        List<GuidanceStepDto> steps = progress.getWorkflowGuidance().getRawJson().getInteractiveSteps();
        for (GuidanceStepDto step : steps) {
            if (!progress.getCompletedStepIds().contains(step.getId())) {
                progress.setCurrentStepId(step.getId());
                return;
            }
        }
        // If all steps completed
        progress.setCurrentStepId(null);
    }

    @Override
    public ProjectGuidanceProgressEntity getProgress(Long projectId) {
        return progressRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("No guidance progress found for this project"));
    }

    @Override
    @Transactional
    public ProjectGuidanceProgressEntity dismissGuidance(Long projectId) {
        ProjectGuidanceProgressEntity progress = progressRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("No guidance progress found for this project"));
        progress.setIsActive(false);
        return progressRepository.save(progress);
    }
}
