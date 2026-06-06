import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useGuidance } from "../context/GuidanceContext";

export function GuidanceNavigator() {
  const { currentStep, isVisible, activeProjectId, autoNavigate } = useGuidance();
  const navigate = useNavigate();
  const { id: workspaceIdStr } = useParams<{ id: string }>();
  const location = useLocation();

  useEffect(() => {
    if (!isVisible || !currentStep || !workspaceIdStr || !activeProjectId || !autoNavigate) return;

    const action = currentStep.action;
    const currentPath = location.pathname;

    // Mapping of guidance actions to routes
    if (action === "NAVIGATE_TASK_BOARD" || action === "CREATE_TASK" || action === "UPDATE_TASK_STATUS") {
      const targetPath = `/workspaces/${workspaceIdStr}/projects/${activeProjectId}/tasks`;
      if (!currentPath.includes(targetPath)) {
        navigate(targetPath);
      }
    } else if (action === "CREATE_SPRINT") {
      const targetPath = `/workspaces/${workspaceIdStr}/projects/${activeProjectId}`;
      if (!currentPath.endsWith(targetPath) && !currentPath.includes("sprints")) {
        navigate(targetPath);
      }
    }
  }, [isVisible, currentStep, workspaceIdStr, activeProjectId, navigate, location.pathname]);

  return null;
}
