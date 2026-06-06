import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { WorkflowGuidanceDto, GuidanceStepDto } from "@/types/api";

interface GuidanceContextType {
  activeGuidance: WorkflowGuidanceDto | null;
  activeProjectId: number | null;
  currentStepId: string | null;
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${activeProjectId}/guidance/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const progress = result.data;
        setCurrentStepId(progress.currentStepId);
        setCompletedStepIds(new Set(progress.completedStepIds));
      }
    } catch (error) {
      console.error("Failed to refresh guidance progress", error);
    }
  }, [activeProjectId]);

  // Periodic polling for progress updates
  useEffect(() => {
    if (!isVisible || !activeGuidance || !activeProjectId) return;
    
    const interval = setInterval(() => {
      refreshProgress(activeProjectId);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isVisible, activeGuidance, activeProjectId, refreshProgress]);

  const startGuidance = useCallback(async (guidance: WorkflowGuidanceDto, projectId: number, workflowId: number, force = false) => {
    // If already active and not forced, don't restart
    if (activeGuidance && !force) return;

    // If dismissed and not forced, don't start
    if (projectId && dismissedProjectIds.has(projectId) && !force) return;

    try {
      // Call backend to initialize progress
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}/guidance/start?workflowId=${workflowId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const progress = result.data;
        
        setActiveGuidance(guidance);
        setActiveProjectId(projectId);
        setCurrentStepId(progress.currentStepId);
        setCompletedStepIds(new Set(progress.completedStepIds));
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Failed to start guidance on backend", error);
    }
  }, [activeGuidance, dismissedProjectIds]);

  const currentStep = useMemo(() => {
    if (!activeGuidance || !currentStepId) return null;
    return activeGuidance.interactiveSteps.find(s => s.id === currentStepId) || null;
  }, [activeGuidance, currentStepId]);

  const nextStep = useCallback(() => {
    if (!activeGuidance || !currentStepId) return;
    const currentIndex = activeGuidance.interactiveSteps.findIndex(s => s.id === currentStepId);
    if (currentIndex < activeGuidance.interactiveSteps.length - 1) {
      setCurrentStepId(activeGuidance.interactiveSteps[currentIndex + 1].id);
    } else {
      setIsVisible(false);
    }
  }, [activeGuidance, currentStepId]);

  const prevStep = useCallback(() => {
    if (!activeGuidance || !currentStepId) return;
    const currentIndex = activeGuidance.interactiveSteps.findIndex(s => s.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(activeGuidance.interactiveSteps[currentIndex - 1].id);
    }
  }, [activeGuidance, currentStepId]);

  const reportAction = useCallback((_actionType: string) => {
    // Backend now handles reporting through actual service actions
  }, []);

  const isStepCompleted = useCallback((stepId: string) => {
    return completedStepIds.has(stepId);
  }, [completedStepIds]);

  const dismiss = useCallback((projectId?: number) => {
    setIsVisible(false);
    setActiveGuidance(null);
    setActiveProjectId(null);
    
    if (projectId) {
      setDismissedProjectIds(prev => {
        const next = new Set(prev);
        next.add(projectId);
        localStorage.setItem("task_sense_dismissed_guidance", JSON.stringify(Array.from(next)));
        return next;
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      activeGuidance,
      activeProjectId,
      currentStepId,
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
    [activeGuidance, activeProjectId, currentStepId, completedStepIds, isVisible, autoNavigate, startGuidance, nextStep, prevStep, dismiss, toggleAutoNavigate, refreshProgress, currentStep, reportAction, isStepCompleted]
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
