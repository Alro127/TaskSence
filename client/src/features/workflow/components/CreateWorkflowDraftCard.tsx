import { ArrowRight, CopyPlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CreateWorkflowDraftCardProps {
  onCreateDraft: () => void;
  onViewWorkflows: () => void;
  disabled?: boolean;
}

export function CreateWorkflowDraftCard({
  onCreateDraft,
  onViewWorkflows,
  disabled = false,
}: CreateWorkflowDraftCardProps) {
  return (
    <aside className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
          <CopyPlus className="h-5 w-5 text-[#233a87]" />
        </div>
        <div>
          <h3
            className="text-base font-bold text-[#1a1c1b]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.01em" }}
          >
            Workflow draft
          </h3>
          <p className="text-xs text-[#444651]">Project-to-workflow sync</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[#444651]">
        Create an editable workflow draft from this project. Tasks are grouped automatically
        into meaningful stages.
      </p>

      <div className="mt-5 grid gap-2">
        <Button
          className="w-full bg-[#233a87] text-white hover:opacity-90"
          disabled={disabled}
          onClick={onCreateDraft}
        >
          <Sparkles className="h-4 w-4" />
          Create draft
        </Button>
        <Button variant="outline" className="w-full" onClick={onViewWorkflows}>
          View workflows
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 border-t border-[#efeeec] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
          System requirement
        </p>
        <p className="mt-1 text-xs text-[#444651]">Requires at least one task in this project.</p>
      </div>
    </aside>
  );
}
