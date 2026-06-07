import { formatDistanceToNow } from "date-fns";
import { ArrowRight, GitBranch, Sparkles, LayoutPanelTop } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkflowDraftResponse } from "@/types/api";

const WORKFLOW_STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]",
  },
  PUBLIC: {
    label: "Published",
    badgeClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]",
  },
} as const;

interface WorkflowCardProps {
  workflow: WorkflowDraftResponse;
  onOpen: (workflowId: number) => void;
}

export function WorkflowCard({ workflow, onOpen }: WorkflowCardProps) {
  const statusCfg = WORKFLOW_STATUS_CONFIG[workflow.status];
  const stepCount = workflow.steps.length;
  const taskCount = workflow.steps.reduce((acc, step) => acc + step.tasks.length, 0);

  return (
    <article className="ghost-border flex h-full flex-col rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:translate-y-[-1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
          {workflow.generationSource === "AI_REFINED" ? (
            <Sparkles className="h-5 w-5 text-[#233a87]" />
          ) : (
            <GitBranch className="h-5 w-5 text-[#233a87]" />
          )}
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            statusCfg.badgeClass,
          )}
        >
          {statusCfg.label}
        </span>
      </div>

      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#444651]">
        <LayoutPanelTop className="h-3 w-3" />
        <span className="truncate max-w-[120px]">{workflow.workspaceName || "Unknown Workspace"}</span>
        <span>/</span>
        <span className="truncate max-w-[120px]">{workflow.projectName || "Unknown Project"}</span>
      </div>

      <h3 className="line-clamp-2 text-base font-bold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}>
        {workflow.name}
      </h3>

      <p className="mt-2 line-clamp-2 text-sm text-[#444651]">
        {workflow.description?.trim() || "No description provided."}
      </p>

      <div className="mt-5 flex items-center gap-3 text-xs text-[#444651]">
        <span>{stepCount} step{stepCount !== 1 ? "s" : ""}</span>
        <span>•</span>
        <span>{taskCount} task{taskCount !== 1 ? "s" : ""}</span>
        <span>•</span>
        <span>{workflow.generationSource === "AI_REFINED" ? "AI refined" : "Rule based"}</span>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-[#444651]">
        <span>
          Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
        </span>
      </div>

      <Button
        className="mt-4 w-full bg-[#233a87] text-white hover:opacity-90"
        onClick={() => onOpen(workflow.id)}
      >
        Open editor
        <ArrowRight className="h-4 w-4" />
      </Button>
    </article>
  );
}
