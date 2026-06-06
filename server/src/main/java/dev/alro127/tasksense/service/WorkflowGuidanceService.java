package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.guidance.WorkflowGuidanceDto;
import dev.alro127.tasksense.dto.request.CreateProjectFromWorkflowRequest;
import dev.alro127.tasksense.dto.request.GenerateGuidanceRequest;
import dev.alro127.tasksense.dto.request.UpdateWorkflowGuidanceRequest;
import dev.alro127.tasksense.dto.response.ProjectResponse;

public interface WorkflowGuidanceService {

    WorkflowGuidanceDto generateGuidance(Long workflowId, GenerateGuidanceRequest request, String authToken);

    WorkflowGuidanceDto updateGuidance(Long workflowId, UpdateWorkflowGuidanceRequest request);

    WorkflowGuidanceDto getGuidanceByProject(Long projectId);

    WorkflowGuidanceDto getGuidanceByWorkflow(Long workflowId);

    ProjectResponse createProjectFromWorkflow(Long workflowId, CreateProjectFromWorkflowRequest request);
}
