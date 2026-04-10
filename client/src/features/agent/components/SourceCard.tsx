import { CheckSquare, FolderKanban, Layers } from "lucide-react";

import type { AIAgentSource } from "@/types/api";

interface SourceCardProps {
  source: AIAgentSource;
}

export function SourceCard({ source }: SourceCardProps) {
  const relation = source.relation;
  const indexIcon =
    source.index === "tasks" ? (
      <CheckSquare className="h-3 w-3" />
    ) : source.index === "projects" ? (
      <FolderKanban className="h-3 w-3" />
    ) : (
      <Layers className="h-3 w-3" />
    );

  return (
    <div className="flex items-start gap-2 rounded-lg border border-card-border bg-white px-3 py-2 text-xs">
      <span className="mt-0.5 shrink-0 text-brand">{indexIcon}</span>
      <div className="min-w-0">
        <p className="font-medium capitalize text-text-primary">{source.index}</p>
        {relation?.workspace && (
          <p className="truncate text-text-secondary">
            <span className="text-[#666]">Workspace: </span>
            {relation.workspace.name}
          </p>
        )}
        {relation?.project && (
          <p className="truncate text-text-secondary">
            <span className="text-[#666]">Project: </span>
            {relation.project.name}
            {relation.project.status && (
              <span className="ml-1 rounded bg-surface-hover px-1 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                {relation.project.status}
              </span>
            )}
          </p>
        )}
        {relation?.sprint && (
          <p className="truncate text-text-secondary">
            <span className="text-[#666]">Sprint: </span>
            {relation.sprint.name}
          </p>
        )}
      </div>
    </div>
  );
}
