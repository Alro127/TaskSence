import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UpdateWorkflowStepRequest } from "@/types/api";

interface TaskOption {
  id: number;
  title: string;
  status: string;
}

interface WorkflowEditorStepCardProps {
  index: number;
  step: UpdateWorkflowStepRequest;
  disabled?: boolean;
  titleError?: string;
  taskError?: string;
  taskOptions: TaskOption[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onUpdate: (partial: Partial<UpdateWorkflowStepRequest>) => void;
  onToggleTask: (taskId: number, checked: boolean) => void;
}

export function WorkflowEditorStepCard({
  index,
  step,
  disabled = false,
  titleError,
  taskError,
  taskOptions,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  onUpdate,
  onToggleTask,
}: WorkflowEditorStepCardProps) {
  return (
    <article className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
            Step {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mt-1 text-xs text-[#444651]">{step.taskIds.length} linked tasks</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={disabled || !canMoveUp}
            onClick={onMoveUp}
            aria-label={`Move step ${index + 1} up`}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={disabled || !canMoveDown}
            onClick={onMoveDown}
            aria-label={`Move step ${index + 1} down`}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            className="text-[#ba1a1a] hover:bg-[rgba(186,26,26,0.08)] hover:text-[#ba1a1a]"
            disabled={disabled}
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
            Step title
          </label>
          <Input
            value={step.title}
            maxLength={255}
            disabled={disabled}
            onChange={(event) => onUpdate({ title: event.target.value })}
            placeholder="Enter step title"
            className={titleError ? "border-[#ba1a1a] focus-visible:ring-[rgba(186,26,26,0.25)]" : undefined}
          />
          {titleError && <p className="text-xs text-[#ba1a1a]">{titleError}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
            Description
          </label>
          <Textarea
            rows={3}
            value={step.description ?? ""}
            disabled={disabled}
            onChange={(event) => onUpdate({ description: event.target.value })}
            placeholder="Describe this stage"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-[rgba(197,197,211,0.35)] bg-[#faf9f7] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
              Linked tasks
            </p>
            <span className="text-xs text-[#444651]">{step.taskIds.length} selected</span>
          </div>

          {taskOptions.length === 0 ? (
            <p className="text-xs text-[#444651]">No available tasks from this workflow.</p>
          ) : (
            <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
              {taskOptions.map((task) => {
                const checked = step.taskIds.includes(task.id);
                return (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-[rgba(197,197,211,0.35)]"
                      checked={checked}
                      disabled={disabled}
                      onChange={(event) => onToggleTask(task.id, event.target.checked)}
                    />
                    <span className="min-w-0 text-xs text-[#1a1c1b]">
                      <span className="line-clamp-1 block">{task.title}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[#444651]">{task.status.replaceAll("_", " ")}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {taskError && <p className="text-xs text-[#ba1a1a]">{taskError}</p>}
        </div>
      </div>
    </article>
  );
}
