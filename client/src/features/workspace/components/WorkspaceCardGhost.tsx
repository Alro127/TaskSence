import { Plus } from "lucide-react";

interface WorkspaceCardGhostProps {
  onClick: () => void;
}

export function WorkspaceCardGhost({ onClick }: WorkspaceCardGhostProps) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[130px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
    >
      <Plus className="h-5 w-5" />
      <span className="text-sm font-medium">New Workspace</span>
    </button>
  );
}
