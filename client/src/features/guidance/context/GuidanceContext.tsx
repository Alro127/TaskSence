import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { WorkflowGuidanceDto, GuidanceStepDto } from "@/types/api";

interface GuidanceContextType {
  activeGuidance: WorkflowGuidanceDto | null;
  currentStepIndex: number; // -1 for high-level summary
  isVisible: boolean;
  startGuidance: (guidance: WorkflowGuidanceDto) => void;
  nextStep: () => void;
  prevStep: () => void;
  dismiss: () => void;
  currentStep: GuidanceStepDto | null;
}

const GuidanceContext = createContext<GuidanceContextType | undefined>(undefined);

export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  const [activeGuidance, setActiveGuidance] = useState<WorkflowGuidanceDto | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isVisible, setIsVisible] = useState(false);

  const startGuidance = useCallback((guidance: WorkflowGuidanceDto) => {
    setActiveGuidance(guidance);
    setCurrentStepIndex(-1); // Start with summary
    setIsVisible(true);
  }, []);

  const nextStep = useCallback(() => {
    if (!activeGuidance) return;
    if (currentStepIndex < activeGuidance.interactiveSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsVisible(false);
    }
  }, [activeGuidance, currentStepIndex]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > -1) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setActiveGuidance(null);
  }, []);

  const currentStep = useMemo(() => {
    if (!activeGuidance || currentStepIndex < 0) return null;
    return activeGuidance.interactiveSteps[currentStepIndex] || null;
  }, [activeGuidance, currentStepIndex]);

  const value = useMemo(
    () => ({
      activeGuidance,
      currentStepIndex,
      isVisible,
      startGuidance,
      nextStep,
      prevStep,
      dismiss,
      currentStep,
    }),
    [activeGuidance, currentStepIndex, isVisible, startGuidance, nextStep, prevStep, dismiss, currentStep]
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
