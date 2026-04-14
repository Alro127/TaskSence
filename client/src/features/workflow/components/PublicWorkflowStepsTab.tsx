import { Info } from "lucide-react";

import type { WorkflowStepResponse } from "@/types/api";

interface PublicWorkflowStepsTabProps {
  steps: WorkflowStepResponse[];
  estimatedMinutes: number;
  progressPercent: number;
  activeStepIndex: number;
}

export function PublicWorkflowStepsTab({
  steps,
  estimatedMinutes,
  progressPercent,
  activeStepIndex,
}: PublicWorkflowStepsTabProps) {
  return (
    <>
      <div className="rounded-xl bg-[#f4f3f1] p-5">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#444651]">Structure</p>
              <p className="text-sm font-semibold text-[#1a1c1b]">
                {steps.length} step{steps.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#444651]">Duration</p>
              <p className="text-sm font-semibold text-[#1a1c1b]">~{estimatedMinutes} min</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#444651]">Complexity</p>
              <span className="inline-flex items-center rounded border border-[rgba(35,58,135,0.2)] bg-[rgba(35,58,135,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#233a87]">
                ADVANCED
              </span>
            </div>
          </div>
          <div className="w-full max-w-[220px]">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#444651]">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(35,58,135,0.1)]">
              <div className="h-full rounded-full bg-[#233a87]" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-[rgba(35,58,135,0.04)] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#233a87]" />
        <p className="text-sm italic text-[#444651]">
          Follow each step in sequence. Steps build on each other, so avoid skipping to keep the workflow output stable.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex;

          return (
            <article
              key={step.id}
              className={`ghost-border rounded-xl p-5 transition-all ${
                isActive
                  ? "border-l-4 border-l-[#233a87] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.09)]"
                  : "bg-[#f4f3f1]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#233a87]">
                    Step {String(step.position).padStart(2, "0")}
                  </p>
                  <h2
                    className="mt-1 text-xl font-bold text-[#1a1c1b]"
                    style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
                  >
                    {step.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="rounded border border-[rgba(0,106,97,0.2)] bg-[rgba(0,106,97,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#006a61]">
                      CURRENT STEP
                    </span>
                  )}
                  <span className="rounded bg-[rgba(68,70,81,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#444651]">
                    ~{Math.max(2, step.tasks.length * 3)} min
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#444651]">
                {step.description?.trim() || "No details for this step."}
              </p>

              <div className="mt-4 rounded-lg bg-[#111827] p-4 font-mono text-xs text-slate-200">
                <p className="text-slate-400">// Task cues for this step</p>
                {step.tasks.length === 0 ? (
                  <p className="text-slate-200">No linked task yet.</p>
                ) : (
                  step.tasks.slice(0, 4).map((task) => <p key={task.id}>- {task.title}</p>)
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
