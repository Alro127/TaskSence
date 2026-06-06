package dev.alro127.tasksense.service;

import dev.alro127.tasksense.domain.entity.ProjectGuidanceProgressEntity;
import dev.alro127.tasksense.domain.enums.GuidanceConditionType;

import java.util.Map;

public interface ProjectGuidanceService {

    /**
     * Initializes guidance tracking for a project based on a workflow's guidance.
     */
    ProjectGuidanceProgressEntity startGuidance(Long projectId, Long workflowId);

    /**
     * Records an action performed by a user and updates any matching guidance targets.
     */
    void reportAction(Long projectId, GuidanceConditionType actionType, Map<String, Object> metadata);

    /**
     * Gets the current progress of guidance for a project.
     */
    ProjectGuidanceProgressEntity getProgress(Long projectId);
}
