import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { WorkflowGuidanceDto, GuidanceStepDto } from "@/types/api";
import { apiBaseUrl } from "@/config/config";

interface GuidanceContextType {
  activeGuidance: WorkflowGuidanceDto | null;
  activeProjectId: number | null;
  currentStepId: string | null;
  currentStepIndex: number;
  completedStepIds: Set<string>;
  isVisible: boolean;
  autoNavigate: boolean;
  startGuidance: (guidance: WorkflowGuidanceDto, projectId: number, workflowId: number, force?: boolean) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  dismiss: (projectId?: number) => void;
  toggleAutoNavigate: () => void;
  refreshProgress: () => Promise<void>;
  currentStep: GuidanceStepDto | null;
  reportAction: (actionType: string) => void;
  isStepCompleted: (stepId: string) => boolean;
}

const GuidanceContext = createContext<GuidanceContextType | undefined>(undefined);

export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  const [activeGuidance, setActiveGuidance] = useState<WorkflowGuidanceDto | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [autoNavigate, setAutoNavigate] = useState(() => {
    const saved = localStorage.getItem("task_sense_guidance_auto_nav");
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [dismissedProjectIds, setDismissedProjectIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("task_sense_dismissed_guidance");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleAutoNavigate = useCallback(() => {
    setAutoNavigate(prev => {
      const next = !prev;
      localStorage.setItem("task_sense_guidance_auto_nav", JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshProgress = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const response = await fetch(`${apiBaseUrl}/projects/${activeProjectId}/guidance/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const progress = result.data;
        if (progress && activeGuidance) {
          const freshCompletedIds = new Set<string>(progress.completedStepIds);
          setCompletedStepIds(freshCompletedIds);

          const backendStepId = progress.currentStepId;
          console.log("[Guidance] Polled progress:", { backendStepId, completedCount: freshCompletedIds.size });
          
          if (!currentStepId) {
            console.log("[Guidance] Initializing currentStepId from backend:", backendStepId);
            setCurrentStepId(backendStepId);
          } else if (autoNavigate && backendStepId !== currentStepId) {
            const steps = activeGuidance.interactiveSteps;
            const localIdx = steps.findIndex(s => s.id === currentStepId);
            const backendIdx = backendStepId ? steps.findIndex(s => s.id === backendStepId) : steps.length;
            
            if (backendIdx > localIdx) {
              console.log(`[Guidance] Auto-navigating: ${currentStepId} -> ${backendStepId}`);
              setCurrentStepId(backendStepId);
              if (!isVisible) {
                console.log("[Guidance] Re-enabling visibility due to auto-navigation.");
                setIsVisible(true);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[Guidance] Failed to refresh progress:", error);
    }
  }, [activeProjectId, autoNavigate, currentStepId, activeGuidance, isVisible]);

  // Periodic polling for progress updates
  useEffect(() => {
    if (!isVisible || !activeGuidance || !activeProjectId) return;
    
    const interval = setInterval(() => {
      void refreshProgress();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isVisible, activeGuidance, activeProjectId, refreshProgress]);

  const reportAction = useCallback(async (actionType: string) => {
    if (!activeProjectId) return;
    try {
      console.log(`[Guidance] Reporting action: ${actionType}`);
      const token = localStorage.getItem('accessToken');
      await fetch(`${apiBaseUrl}/projects/${activeProjectId}/guidance/report?actionType=${actionType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      // Refresh after reporting
      void refreshProgress();
    } catch (error) {
      console.error("[Guidance] Failed to report action:", error);
    }
  }, [activeProjectId, refreshProgress]);

  const startGuidance = useCallback(async (guidance: WorkflowGuidanceDto, projectId: number, workflowId: number, force = false) => {
    console.log("[Guidance] startGuidance called", { projectId, workflowId, force, currentIsVisible: isVisible, hasActive: !!activeGuidance });
    
    // If already active and not forced, don't restart
    if (activeGuidance && !force) {
      console.log("[Guidance] Already active, skipping startGuidance.");
      return;
    }

    // If dismissed and not forced, don't start
    if (projectId && dismissedProjectIds.has(projectId) && !force) {
      console.log("[Guidance] Project dismissed, skipping startGuidance.");
      return;
    }

    if (!projectId || !workflowId || typeof workflowId === 'boolean') {
      console.error("[Guidance] Cannot start guidance: invalid projectId or workflowId", { projectId, workflowId });
      return;
    }

    // If forcing restart, clear local state first to trigger UI resets
    if (force) {
      console.log("[Guidance] Forcing restart, clearing local state.");
      setIsVisible(false);
      setCurrentStepId(null);
      setCompletedStepIds(new Set());
    }

    try {
      // Call backend to initialize progress
      const url = `${apiBaseUrl}/projects/${projectId}/guidance/start?workflowId=${workflowId}${force ? '&force=true' : ''}`;
      const token = localStorage.getItem('accessToken');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const progress = result.data;
        
        if (progress) {
          console.log("[Guidance] Guidance started/resumed. Current step:", progress.currentStepId);
          setActiveGuidance(guidance);
          setActiveProjectId(projectId);
          
          // Small delay to ensure any "force clear" above has finished its render cycle
          setTimeout(() => {
            setCurrentStepId(progress.currentStepId);
            setCompletedStepIds(new Set(progress.completedStepIds));
            setIsVisible(true);
            console.log("[Guidance] Visibility set to TRUE.");
          }, 50);
        }
      } else {
        const error = await response.text();
        console.error("[Guidance] Backend failed to start guidance:", response.status, error);
      }
    } catch (error) {
      console.error("[Guidance] Network error starting guidance:", error);
    }
  }, [activeGuidance, dismissedProjectIds, isVisible]);

  const currentStep = useMemo(() => {
    if (!activeGuidance || !currentStepId) return null;
    return activeGuidance.interactiveSteps.find(s => s.id === currentStepId) || null;
  }, [activeGuidance, currentStepId]);

  const currentStepIndex = useMemo(() => {
    if (!activeGuidance || !currentStepId) return -1;
    return activeGuidance.interactiveSteps.findIndex(s => s.id === currentStepId);
  }, [activeGuidance, currentStepId]);

  const nextStep = useCallback(() => {
    if (!activeGuidance || !currentStepId) return;
    
    // If current step is manual or we're skipping, we should report it to backend
    if (currentStep?.completionCondition.type === 'MANUAL') {
      console.log("[Guidance] Reporting manual completion for step:", currentStepId);
      void reportAction('MANUAL');
    }

    const currentIndex = activeGuidance.interactiveSteps.findIndex(s => s.id === currentStepId);
    if (currentIndex === -1) {
      console.warn("[Guidance] Current step ID not found in interactive steps:", currentStepId);
      return;
    }

    if (currentIndex < activeGuidance.interactiveSteps.length - 1) {
      const nextId = activeGuidance.interactiveSteps[currentIndex + 1].id;
      console.log(`[Guidance] Manually advancing: ${currentStepId} -> ${nextId}`);
      setCurrentStepId(nextId);
    } else {
      console.log("[Guidance] Last step reached. Closing overlay.");
      setIsVisible(false);
    }
  }, [activeGuidance, currentStepId, currentStep, reportAction]);

  const prevStep = useCallback(() => {
    if (!activeGuidance || !currentStepId) return;
    const currentIndex = activeGuidance.interactiveSteps.findIndex(s => s.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(activeGuidance.interactiveSteps[currentIndex - 1].id);
    }
  }, [activeGuidance, currentStepId]);

  const isStepCompleted = useCallback((stepId: string) => {
    return completedStepIds.has(stepId);
  }, [completedStepIds]);

  const dismiss = useCallback((projectId?: number) => {
    console.log("[Guidance] Dismissing guidance for project:", projectId);
    setIsVisible(false);
    // Don't clear activeGuidance here so it can be resumed later
    
    if (projectId) {
      setDismissedProjectIds(prev => {
        const next = new Set(prev);
        next.add(projectId);
        localStorage.setItem("task_sense_dismissed_guidance", JSON.stringify(Array.from(next)));
        return next;
      });
    }
  }, []);

  useEffect(() => {
    console.log("[Guidance] Global state update:", { isVisible, currentStepId, activeProjectId, hasActive: !!activeGuidance });
  }, [isVisible, currentStepId, activeProjectId, activeGuidance]);

  const value = useMemo(
    () => ({
      activeGuidance,
      activeProjectId,
      currentStepId,
      currentStepIndex,
      completedStepIds,
      isVisible,
      autoNavigate,
      startGuidance,
      nextStep,
      prevStep,
      dismiss,
      toggleAutoNavigate,
      refreshProgress,
      currentStep,
      reportAction,
      isStepCompleted,
    }),
    [activeGuidance, activeProjectId, currentStepId, currentStepIndex, completedStepIds, isVisible, autoNavigate, startGuidance, nextStep, prevStep, dismiss, toggleAutoNavigate, refreshProgress, currentStep, reportAction, isStepCompleted]
  );

  return <GuidanceContext.Provider value={value}>{children}</GuidanceContext.Provider>;
}

export function useGuidance() {
  const context = useContext(GuidanceContext);
  if (context === undefined) {
    throw new Error("useGuidance must be used within a GuidanceProvider");
  }
  return context;
}
