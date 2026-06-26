import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Eye, Loader2, Plus, Sparkles, Trash2, RotateCcw } from "lucide-react";

import { useAppSelector } from "@/app/hooks";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type {
  UpdateWorkflowDraftRequest,
  UpdateWorkflowStepRequest,
  WorkflowDraftResponse,
} from "@/types/api";

import {
  useGetMyWorkflowsQuery,
  usePublishWorkflowMutation,
  useUnpublishWorkflowMutation,
  useUpdateWorkflowDraftMutation,
  useDeleteWorkflowDraftMutation,
  useGenerateGuidanceMutation,
  useGetGuidanceByWorkflowQuery,
} from "../api/workflowApi";
import { RegenerateGuidanceDialog, WorkflowEditorStepCard } from "../components";

interface TaskOption {
  id: number;
  title: string;
  status: string;
}

interface ValidationState {
  name?: string;
  steps?: string;
  stepTitles: Record<number, string>;
  stepTasks: Record<number, string>;
}

const emptyValidationState: ValidationState = {
  stepTitles: {},
  stepTasks: {},
};

const WORKFLOW_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    className: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]",
  },
  PUBLIC: {
    label: "Published",
    className: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]",
  },
} as const;

function extractTaskOptions(workflow: WorkflowDraftResponse): TaskOption[] {
  const map = new Map<number, TaskOption>();
  workflow.steps.forEach((step) => {
    step.tasks.forEach((task) => {
      if (!map.has(task.id)) {
        map.set(task.id, {
          id: task.id,
          title: task.title,
          status: task.status,
        });
      }
    });
  });

  return [...map.values()];
}

function toEditableSteps(workflow: WorkflowDraftResponse): UpdateWorkflowStepRequest[] {
  return [...workflow.steps]
    .sort((a, b) => a.position - b.position)
    .map((step, index) => ({
      id: step.id,
      title: step.title,
      description: step.description ?? "",
      position: index + 1,
      sourceType: step.sourceType,
      sourceSprintId: step.sourceSprintId,
      taskIds: step.tasks.map((task) => task.id),
    }));
}

function normalizeSteps(steps: UpdateWorkflowStepRequest[]): UpdateWorkflowStepRequest[] {
  return steps.map((step, index) => ({
    ...step,
    position: index + 1,
  }));
}

function buildPayload(name: string, description: string, steps: UpdateWorkflowStepRequest[]): UpdateWorkflowDraftRequest {
  return {
    name: name.trim(),
    description: description.trim() || undefined,
    steps: normalizeSteps(steps).map((step) => ({
      id: step.id,
      title: step.title.trim(),
      description: step.description?.trim() || undefined,
      position: step.position,
      sourceType: step.sourceType,
      sourceSprintId: step.sourceSprintId ?? null,
      taskIds: [...step.taskIds],
    })),
  };
}

function toComparablePayload(payload: UpdateWorkflowDraftRequest) {
  return {
    name: payload.name.trim(),
    description: payload.description?.trim() ?? "",
    steps: payload.steps.map((step) => ({
      title: step.title.trim(),
      description: step.description?.trim() ?? "",
      position: step.position,
      sourceType: step.sourceType ?? "",
      sourceSprintId: step.sourceSprintId ?? null,
      taskIds: [...step.taskIds].sort((a, b) => a - b),
    })),
  };
}

function validatePayload(payload: UpdateWorkflowDraftRequest): ValidationState {
  const validation: ValidationState = {
    stepTitles: {},
    stepTasks: {},
  };

  if (!payload.name.trim()) {
    validation.name = "Workflow name is required.";
  }

  if (payload.steps.length === 0) {
    validation.steps = "At least one step is required.";
  }

  payload.steps.forEach((step, index) => {
    if (!step.title.trim()) {
      validation.stepTitles[index] = "Step title is required.";
    }

    if (step.taskIds.length === 0) {
      validation.stepTasks[index] = "Each step must contain at least one task.";
    }
  });

  return validation;
}

function hasValidationErrors(validation: ValidationState): boolean {
  return Boolean(
    validation.name ||
      validation.steps ||
      Object.keys(validation.stepTitles).length > 0 ||
      Object.keys(validation.stepTasks).length > 0,
  );
}

interface EditorState {
  status: WorkflowDraftResponse["status"];
  name: string;
  description: string;
  steps: UpdateWorkflowStepRequest[];
  initialComparable: string;
}

function createEditorState(workflow: WorkflowDraftResponse): EditorState {
  const steps = toEditableSteps(workflow);
  const payload = buildPayload(workflow.name, workflow.description ?? "", steps);
  return {
    status: workflow.status,
    name: workflow.name,
    description: workflow.description ?? "",
    steps,
    initialComparable: JSON.stringify(toComparablePayload(payload)),
  };
}

export function WorkflowEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workflowId: workflowIdParam } = useParams<{ workflowId: string }>();
  const workflowId = Number(workflowIdParam);
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id);

  const workflowFromState =
    ((location.state as { workflow?: WorkflowDraftResponse } | null)?.workflow ?? null);

  const {
    data: workflowListData,
    isLoading,
    isError,
    refetch,
  } = useGetMyWorkflowsQuery({ page: 0, size: 200 }, { skip: Number.isNaN(workflowId) });

  const { data: guidanceData, isLoading: isGuidanceLoading } = useGetGuidanceByWorkflowQuery(
    { workflowId },
    { skip: Number.isNaN(workflowId) },
  );
  const guidance = guidanceData?.data;

  const workflow = useMemo(() => {
    const fromList = workflowListData?.data?.data.find((item) => item.id === workflowId);
    if (fromList) {
      return fromList;
    }

    if (workflowFromState && workflowFromState.id === workflowId) {
      return workflowFromState;
    }

    return null;
  }, [workflowFromState, workflowId, workflowListData?.data?.data]);

  useEffect(() => {
    if (workflow && currentUserId && workflow.createdBy !== currentUserId) {
      navigate(`/explore/${workflow.id}`, { replace: true });
    }
  }, [workflow, currentUserId, navigate]);

  const [editorStateById, setEditorStateById] = useState<Record<number, EditorState>>({});
  const [validation, setValidation] = useState<ValidationState>(emptyValidationState);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isUnpublishDialogOpen, setIsUnpublishDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);

  const [updateWorkflowDraft, { isLoading: isSaving }] = useUpdateWorkflowDraftMutation();
  const [publishWorkflow, { isLoading: isPublishing }] = usePublishWorkflowMutation();
  const [unpublishWorkflow, { isLoading: isUnpublishing }] = useUnpublishWorkflowMutation();
  const [deleteWorkflowDraft, { isLoading: isDeleting }] = useDeleteWorkflowDraftMutation();
  const [generateGuidance, { isLoading: isGeneratingGuidance }] = useGenerateGuidanceMutation();

  const handleGenerateGuidance = () => {
    setIsGuidanceDialogOpen(true);
  };

  const handleConfirmRegenerate = async (userInstructions: string) => {
    if (!workflow) {
      return;
    }

    try {
      await generateGuidance({
        workflowId: workflow.id,
        body: userInstructions.trim() ? { userInstructions } : undefined,
      }).unwrap();
      toast.success("AI Guidance generated successfully");
      setIsGuidanceDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to generate guidance."));
    }
  };

  const taskCatalog = useMemo(() => (workflow ? extractTaskOptions(workflow) : []), [workflow]);
  const baselineEditorState = useMemo(() => (workflow ? createEditorState(workflow) : null), [workflow]);
  const storedEditorState = workflow ? editorStateById[workflow.id] : undefined;
  const effectiveEditorState = storedEditorState ?? baselineEditorState;

  const currentPayload = useMemo(() => {
    if (!effectiveEditorState) {
      return null;
    }

    return buildPayload(effectiveEditorState.name, effectiveEditorState.description, effectiveEditorState.steps);
  }, [effectiveEditorState]);

  const isDirty = useMemo(() => {
    if (!effectiveEditorState || !currentPayload) {
      return false;
    }

    return (
      JSON.stringify(toComparablePayload(currentPayload)) !== effectiveEditorState.initialComparable
    );
  }, [effectiveEditorState, currentPayload]);

  const isReadOnly = effectiveEditorState?.status === "PUBLIC" || isPublishing || isDeleting || isUnpublishing;

  const updateEditorState = (
    updater: (prev: EditorState) => EditorState,
    options?: { clearValidation?: boolean },
  ) => {
    if (!workflow || !effectiveEditorState) {
      return;
    }

    const nextState = updater(effectiveEditorState);
    setEditorStateById((prev) => ({ ...prev, [workflow.id]: nextState }));

    if (options?.clearValidation !== false) {
      setValidation(emptyValidationState);
    }
  };

  const applyWorkflow = (nextWorkflow: WorkflowDraftResponse) => {
    const nextState = createEditorState(nextWorkflow);
    setEditorStateById((prev) => ({ ...prev, [nextWorkflow.id]: nextState }));
    setValidation(emptyValidationState);
  };

  const runValidation = (): boolean => {
    if (!currentPayload) {
      return false;
    }

    const nextValidation = validatePayload(currentPayload);
    setValidation(nextValidation);

    const invalid = hasValidationErrors(nextValidation);
    if (invalid) {
      toast.error("Validation failed", {
        description: "Please fix required fields before saving.",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!workflow || !currentPayload || isReadOnly) {
      return;
    }

    if (!runValidation()) {
      return;
    }

    try {
      const response = await updateWorkflowDraft({
        workflowId: workflow.id,
        body: currentPayload,
      }).unwrap();

      applyWorkflow(response.data);
      toast.success("Workflow draft saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save workflow draft."));
    }
  };

  const handleConfirmPublish = async () => {
    if (!workflow || !currentPayload || isReadOnly) {
      return;
    }

    if (!runValidation()) {
      return;
    }

    try {
      const response = await publishWorkflow({ workflowId: workflow.id }).unwrap();
      applyWorkflow(response.data);
      setIsPublishDialogOpen(false);
      toast.success("Workflow published successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to publish workflow."));
    }
  };

  const handleConfirmUnpublish = async () => {
    if (!workflow || isUnpublishing) {
      return;
    }

    try {
      const response = await unpublishWorkflow({ workflowId: workflow.id }).unwrap();
      applyWorkflow(response.data);
      setIsUnpublishDialogOpen(false);
      toast.success("Workflow unpublished successfully. You can now edit it again.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to unpublish workflow."));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!workflow || isReadOnly) {
      return;
    }

    try {
      await deleteWorkflowDraft({ workflowId: workflow.id }).unwrap();
      setIsDeleteDialogOpen(false);
      toast.success("Workflow draft deleted");
      navigate("/workflows");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete workflow draft."));
    }
  };

  if (Number.isNaN(workflowId)) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-[#444651]">Invalid workflow id.</p>
        <Button variant="outline" onClick={() => navigate("/workflows")}>Back to workflows</Button>
      </div>
    );
  }

  if (isLoading && !workflow) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#444651]" />
      </div>
    );
  }

  if ((isError && !workflow) || !workflow || !effectiveEditorState || !currentPayload) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(186,26,26,0.08)]">
          <AlertTriangle className="h-6 w-6 text-[#ba1a1a]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#1a1c1b]">Workflow not found or access denied</p>
          <p className="text-xs text-[#444651]">This workflow may not exist or is not available in your library.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          <Button className="bg-[#233a87] text-white hover:opacity-90" onClick={() => navigate("/workflows")}>Back to workflows</Button>
        </div>
      </div>
    );
  }

  const statusCfg = WORKFLOW_STATUS_CONFIG[effectiveEditorState.status];

  return (
    <div className="flex flex-col">
      <header className="sticky top-[-1rem] z-20 -mx-4 -mt-4 mb-6 border-b border-[#efeeec] bg-[#faf9f7]/95 pb-3 pt-7 backdrop-blur-sm md:top-[-2rem] md:-mx-8 md:-mt-8 md:pb-3 md:pt-11">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/workflows")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}>
                  {effectiveEditorState.name || workflow.name}
                </h1>
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", statusCfg.className)}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-[#444651]">
                {isSaving ? "Saving..." : isDirty ? "Unsaved changes" : "All changes saved"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && effectiveEditorState.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-[#ba1a1a] hover:bg-[rgba(186,26,26,0.08)] hover:text-[#ba1a1a]"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting || isSaving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Draft
              </Button>
            )}

            {effectiveEditorState.status === "PUBLIC" && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-[#444651] text-[#444651] hover:bg-[rgba(68,70,81,0.04)]"
                onClick={() => setIsUnpublishDialogOpen(true)}
                disabled={isUnpublishing}
              >
                {isUnpublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Unpublish
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-9 border-[#233a87] text-[#233a87] hover:bg-[rgba(35,58,135,0.04)]"
              disabled={isGeneratingGuidance || isGuidanceLoading}
              onClick={() => void handleGenerateGuidance()}
            >
              {isGeneratingGuidance ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {guidance ? "Regenerate AI Guidance" : "Generate AI Guidance"}
            </Button>

            <Button variant="outline" onClick={handleSave} disabled={isReadOnly || isSaving || !isDirty}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>

            <Button
              className="bg-[#233a87] text-white hover:opacity-90"
              disabled={isReadOnly || isSaving || isDirty}
              onClick={() => setIsPublishDialogOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              {effectiveEditorState.status === "PUBLIC" ? "Published" : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      {effectiveEditorState.status === "PUBLIC" && (
        <div className="rounded-xl border border-[rgba(0,106,97,0.2)] bg-[rgba(0,106,97,0.08)] px-4 py-3 text-sm text-[#006a61]">
          This workflow is published and now read-only. Click "Unpublish" to resume editing.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="space-y-4 xl:col-span-7">
          <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
                Workflow name
              </label>
              <Input
                value={effectiveEditorState.name}
                disabled={isReadOnly}
                maxLength={255}
                onChange={(event) =>
                  updateEditorState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Enter workflow name"
                className={validation.name ? "border-[#ba1a1a] focus-visible:ring-[rgba(186,26,26,0.25)]" : undefined}
              />
              {validation.name && <p className="text-xs text-[#ba1a1a]">{validation.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
                Description
              </label>
              <Textarea
                rows={3}
                value={effectiveEditorState.description}
                disabled={isReadOnly}
                onChange={(event) =>
                  updateEditorState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe your workflow"
              />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h2
                className="text-2xl font-bold text-[#1a1c1b]"
                style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
              >
                Curate Steps
              </h2>
              <p className="text-sm text-[#444651]">Define stages and assign linked tasks.</p>
            </div>
            <Button
              variant="ghost"
              className="text-[#233a87] hover:bg-[rgba(35,58,135,0.08)] hover:text-[#233a87]"
              onClick={() =>
                updateEditorState((prev) => ({
                  ...prev,
                  steps: [
                    ...prev.steps,
                    {
                      title: "",
                      description: "",
                      position: prev.steps.length + 1,
                      sourceType: "RULE",
                      sourceSprintId: null,
                      taskIds: taskCatalog[0] ? [taskCatalog[0].id] : [],
                    },
                  ],
                }))
              }
              disabled={isReadOnly}
            >
              <Plus className="h-4 w-4" />
              Add step
            </Button>
          </div>

          {validation.steps && (
            <div className="rounded-lg border border-[rgba(186,26,26,0.2)] bg-[rgba(186,26,26,0.08)] px-3 py-2 text-xs text-[#ba1a1a]">
              {validation.steps}
            </div>
          )}

          <div className="space-y-4">
            {effectiveEditorState.steps.map((step, index) => (
              <WorkflowEditorStepCard
                key={`${step.id ?? "new"}-${index}`}
                index={index}
                step={step}
                disabled={isReadOnly}
                titleError={validation.stepTitles[index]}
                taskError={validation.stepTasks[index]}
                taskOptions={taskCatalog}
                canMoveUp={index > 0}
                canMoveDown={index < effectiveEditorState.steps.length - 1}
                onMoveUp={() =>
                  updateEditorState((prev) => {
                    const next = [...prev.steps];
                    const [moved] = next.splice(index, 1);
                    next.splice(index - 1, 0, moved);
                    return { ...prev, steps: normalizeSteps(next) };
                  })
                }
                onMoveDown={() =>
                  updateEditorState((prev) => {
                    const next = [...prev.steps];
                    const [moved] = next.splice(index, 1);
                    next.splice(index + 1, 0, moved);
                    return { ...prev, steps: normalizeSteps(next) };
                  })
                }
                onRemove={() =>
                  updateEditorState((prev) => ({
                    ...prev,
                    steps: normalizeSteps(prev.steps.filter((_, itemIndex) => itemIndex !== index)),
                  }))
                }
                onUpdate={(partial) =>
                  updateEditorState((prev) => {
                    const next = [...prev.steps];
                    next[index] = { ...next[index], ...partial };
                    return { ...prev, steps: next };
                  })
                }
                onToggleTask={(taskId, checked) =>
                  updateEditorState((prev) => {
                    const next = [...prev.steps];
                    const currentTaskIds = next[index].taskIds;
                    next[index] = {
                      ...next[index],
                      taskIds: checked
                        ? Array.from(new Set([...currentTaskIds, taskId]))
                        : currentTaskIds.filter((id) => id !== taskId),
                    };
                    return { ...prev, steps: next };
                  })
                }
              />
            ))}

            <button
              type="button"
              disabled={isReadOnly}
              onClick={() =>
                updateEditorState((prev) => ({
                  ...prev,
                  steps: [
                    ...prev.steps,
                    {
                      title: "",
                      description: "",
                      position: prev.steps.length + 1,
                      sourceType: "RULE",
                      sourceSprintId: null,
                      taskIds: taskCatalog[0] ? [taskCatalog[0].id] : [],
                    },
                  ],
                }))
              }
              className="flex min-h-[92px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-[#444651] transition-all hover:border-[#233a87]/40 hover:bg-[rgba(35,58,135,0.04)] hover:text-[#233a87] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add workflow stage</span>
            </button>
          </div>
        </section>

        <aside className="xl:col-span-5">
          <div className="space-y-6 xl:sticky xl:top-24">
            {/* Snapshot Preview Card */}
            <div className="space-y-4 rounded-xl bg-[#f4f3f1] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}>
                  Snapshot Preview
                </h3>
                <Eye className="h-4 w-4 text-[#444651]" />
              </div>
              <p className="text-xs text-[#444651]">Read-only timeline of the current workflow structure.</p>

              <div className="max-h-[40vh] space-y-4 overflow-y-auto pr-1 hide-scrollbar">
                {effectiveEditorState.steps.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[rgba(197,197,211,0.5)] bg-white p-4 text-xs text-[#444651]">
                    No steps yet. Add your first stage.
                  </div>
                ) : (
                  effectiveEditorState.steps.map((step, index) => (
                    <div key={`preview-${step.id ?? index}`} className="relative border-l-2 border-[rgba(35,58,135,0.2)] pl-4">
                      <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[#233a87]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
                        Step {String(index + 1).padStart(2, "0")}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-[#1a1c1b]">{step.title.trim() || "Untitled step"}</h4>
                      <p className="mt-1 text-xs text-[#444651] line-clamp-2">{step.description?.trim() || "No description"}</p>

                      <div className="mt-2 space-y-1">
                        {step.taskIds.length === 0 ? (
                          <p className="text-xs text-[#ba1a1a]">No linked tasks</p>
                        ) : (
                          step.taskIds.map((taskId) => {
                            const task = taskCatalog.find((item) => item.id === taskId);
                            if (!task) {
                              return null;
                            }

                            return (
                              <div key={task.id} className="rounded-md border border-[rgba(197,197,211,0.35)] bg-white px-2 py-1">
                                <p className="line-clamp-1 text-xs text-[#1a1c1b]">{task.title}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Guidance Preview Card */}
            <div className="space-y-4 rounded-xl bg-white p-5 border border-[#efeeec] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#233a87]" />
                  <h3 className="text-base font-bold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}>
                    AI Guidance Preview
                  </h3>
                </div>
                {guidance ? (
                  <span className="inline-flex items-center rounded-full bg-[rgba(0,106,97,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#006a61]">
                    GENERATED
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[rgba(186,26,26,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#ba1a1a]">
                    MISSING
                  </span>
                )}
              </div>

              {isGuidanceLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !guidance ? (
                <div className="rounded-lg border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] p-4 text-center">
                  <p className="text-xs text-[#444651]">No guidance generated yet.</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="mt-1 h-auto p-0 text-[#233a87]"
                    onClick={handleGenerateGuidance}
                  >
                    Generate now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[rgba(35,58,135,0.04)] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#233a87] mb-1">Onboarding Summary</p>
                    <p className="text-xs text-[#444651] line-clamp-3">{guidance.summary.overview}</p>
                  </div>

                  <div className="max-h-[30vh] space-y-3 overflow-y-auto pr-1 hide-scrollbar">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#444651]">Interactive Steps</p>
                    {guidance.interactiveSteps.map((step, idx) => (
                      <div key={step.id} className="flex gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#efeeec] text-[10px] font-bold text-[#444651]">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1a1c1b] truncate">{step.title}</p>
                          <p className="text-[10px] text-[#444651] line-clamp-1 italic">
                            Action: {step.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create public workflow</DialogTitle>
            <DialogDescription>
              This will publish <span className="font-semibold text-[#233a87]">{effectiveEditorState.name || workflow.name}</span> and lock further edits.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-[rgba(35,58,135,0.2)] bg-[rgba(35,58,135,0.08)] px-3 py-2 text-xs text-[#233a87]">
            Ensure all required steps and tasks are complete before publishing.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)} disabled={isPublishing}>
              Cancel
            </Button>
            <Button className="bg-[#233a87] text-white hover:opacity-90" onClick={handleConfirmPublish} disabled={isPublishing}>
              {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUnpublishDialogOpen} onOpenChange={setIsUnpublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unpublish workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to unpublish <span className="font-semibold text-[#1a1c1b]">{effectiveEditorState.name || workflow.name}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-[rgba(68,70,81,0.2)] bg-[rgba(68,70,81,0.08)] px-3 py-2 text-xs text-[#444651]">
            This will revert the workflow to a draft status, making it invisible to the public but allowing you to edit it again.
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnpublishDialogOpen(false)} disabled={isUnpublishing}>
              Cancel
            </Button>
            <Button className="bg-[#233a87] text-white hover:opacity-90" onClick={handleConfirmUnpublish} disabled={isUnpublishing}>
              {isUnpublishing && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#ba1a1a]">
              <AlertTriangle className="h-5 w-5" />
              Delete Workflow Draft
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-[#1a1c1b]">{effectiveEditorState.name || workflow.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-[#ba1a1a] text-white hover:bg-[#931515]"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RegenerateGuidanceDialog
        open={isGuidanceDialogOpen}
        onOpenChange={setIsGuidanceDialogOpen}
        onConfirm={handleConfirmRegenerate}
        isLoading={isGeneratingGuidance}
        isRegenerating={!!guidance}
      />
    </div>
  );
}
