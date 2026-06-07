import { useEffect, useState, useLayoutEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronRight, ChevronLeft, CheckCircle2, RefreshCw, Settings2 } from "lucide-react";
import { useGuidance } from "../context/GuidanceContext";
import { capabilityRegistry } from "../utils/CapabilityRegistry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function GuidanceOverlay() {
  const { 
    isVisible, 
    currentStep, 
    currentStepIndex,
    activeGuidance, 
    nextStep, 
    prevStep, 
    dismiss, 
    isStepCompleted, 
    autoNavigate, 
    toggleAutoNavigate, 
    refreshProgress,
    completedStepIds 
  } = useGuidance();
  const { projectId: projectIdStr } = useParams<{ projectId: string }>();
  const projectId = projectIdStr ? Number(projectIdStr) : undefined;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detect modals to hide spotlight
  useEffect(() => {
    const checkModals = () => {
      const modal = document.querySelector('[role="dialog"], [data-state="open"]');
      setIsModalOpen(!!modal);
    };

    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    checkModals(); // Initial check
    return () => observer.disconnect();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProgress();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleDismiss = () => {
    dismiss(projectId);
  };

  // Re-calculate target position when registry changes or step changes
  useLayoutEffect(() => {
    // Reset state first to avoid showing old target during transitions
    setTargetRect(null);
    setTargetFound(false);

    if (!isVisible || !currentStep || !activeGuidance) {
      return;
    }

    const updatePosition = () => {
      const targetName = currentStep?.uiTarget;
      if (!targetName) return false;
      
      const element = capabilityRegistry.getTarget(targetName);
      if (!element) {
        return false;
      }
      
      const rect = element.getBoundingClientRect();
      // Only consider it found if it has actual dimensions and is on screen
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
        setTargetFound(true);
        return true;
      }
      return false;
    };

    // Try immediately
    const found = updatePosition();
    
    // Setup a retry interval (helps with tab transitions and delayed rendering)
    let retryInterval: NodeJS.Timeout | null = null;
    if (!found) {
      let attempts = 0;
      retryInterval = setInterval(() => {
        attempts++;
        if (updatePosition()) {
          if (retryInterval) clearInterval(retryInterval);
        } else if (attempts > 100) { // Try for 10 seconds (100 * 100ms)
          if (retryInterval) clearInterval(retryInterval);
        }
      }, 100);
    }

    // Update position on scroll/resize to keep it anchored
    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    const unsubscribe = capabilityRegistry.subscribe(updatePosition);
    
    return () => {
      unsubscribe();
      if (retryInterval) clearInterval(retryInterval);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isVisible, currentStep, activeGuidance]);

  if (!isVisible || !activeGuidance) return null;

  // Render high-level summary if no current step yet
  if (!currentStep) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-white rounded-2xl p-8 shadow-2xl border border-slate-200 z-[10000]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Project Onboarding</h2>
          </div>

          <div className="space-y-6">
            <p className="text-slate-600 leading-relaxed">
              {activeGuidance.summary.overview}
            </p>

            {activeGuidance.summary.bestPractices.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Best Practices</h3>
                <ul className="space-y-2">
                  {activeGuidance.summary.bestPractices.map((bp, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {bp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Button onClick={nextStep} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              Start Interactive Tour
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={handleDismiss} className="text-slate-400 hover:text-slate-600">
              Skip
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const completed = isStepCompleted(currentStep.id);

  // Smart positioning for tooltip
  const getTooltipStyle = () => {
    if (isModalOpen) {
      return { top: 24, left: 24 };
    }
    if (!targetRect) return {};

    const tooltipHeight = 250; // Estimate
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const preferAbove = spaceBelow < tooltipHeight + 40;

    return {
      top: preferAbove ? targetRect.top - tooltipHeight - 16 : targetRect.bottom + 16,
      left: Math.max(16, Math.min(window.innerWidth - 304, targetRect.left + (targetRect.width / 2) - 144)),
    };
  };

  // Render tooltip anchored to target
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <AnimatePresence>
        {targetRect && targetFound ? (
          <>
            {/* Highlight box around target - hidden if modal is open */}
            {!isModalOpen && targetRect.width > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute border-2 border-emerald-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.15)] pointer-events-none z-[9999]"
                style={{
                  top: targetRect.top - 8,
                  left: targetRect.left - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                }}
              />
            )}

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                "absolute bg-white rounded-xl shadow-xl border border-slate-200 p-5 w-72 pointer-events-auto z-[10000]",
                isModalOpen && "shadow-2xl border-emerald-100"
              )}
              style={getTooltipStyle()}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                  Step {currentStepIndex + 1} of {activeGuidance.interactiveSteps.length}
                </span>
                <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                {currentStep.title}
                {completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </motion.div>
                )}
              </h3>
              <p className="text-sm text-slate-600 mb-4">{currentStep.description}</p>

              {completed && (
                <p className="text-[11px] font-medium text-emerald-600 mb-3 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Action completed! Ready for next step.
                </p>
              )}
              
              <div className="flex gap-2">
                <Button size="sm" onClick={nextStep} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {currentStepIndex === activeGuidance.interactiveSteps.length - 1 ? "Finish" : "Next"}
                </Button>
                {currentStepIndex > 0 && (
                  <Button size="sm" variant="outline" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleRefresh} 
                  disabled={isRefreshing}
                  className="px-2"
                  title="Sync progress"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-3 w-3 text-slate-400" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Auto-Navigate</span>
                </div>
                <Switch 
                  checked={autoNavigate} 
                  onCheckedChange={toggleAutoNavigate}
                  className="scale-75 data-[state=checked]:bg-emerald-500" 
                />
              </div>
            </motion.div>
          </>
        ) : (
          /* Fallback UI when target not found on screen */
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-6 pointer-events-none pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-2xl border border-emerald-100 p-5 w-full max-w-md pointer-events-auto z-[10000]"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      Step {currentStepIndex + 1} of {activeGuidance.interactiveSteps.length}
                    </span>
                    <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    {currentStep.title}
                    {completed && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">{currentStep.description}</p>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={nextStep} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      {currentStepIndex === activeGuidance.interactiveSteps.length - 1 ? "Finish" : "Next"}
                    </Button>
                    {currentStepIndex > 0 && (
                      <Button size="sm" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
