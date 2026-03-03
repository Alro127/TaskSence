import { format } from "date-fns";
import { FolderKanban, MoreVertical, Pin, PinOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/api";

interface WorkspaceCardProps {
  workspace: Workspace;
  isPinned: boolean;
  onTogglePin: (id: number) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  projectCount?: number;
  variant?: "default" | "pinned";
}

export function WorkspaceCard({
  workspace,
  isPinned,
  onTogglePin,
  onEdit,
  onDelete,
  projectCount = 0,
  variant = "default",
}: WorkspaceCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "cursor-pointer rounded-lg p-0 gap-0 transition-shadow hover:shadow-md",
        variant === "pinned" && "border-primary/30 bg-primary/5",
      )}
    >
      {/* Clickable body — navigates to detail */}
      <div
        className="flex-1 p-5"
        onClick={() => navigate(`/workspaces/${workspace.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Icon + Name + Description */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{workspace.name}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {workspace.description ?? "No description"}
              </p>
            </div>
          </div>

          {/* Actions — stop propagation so click doesn't navigate */}
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(isPinned && "text-amber-500 hover:text-amber-600")}
              title={isPinned ? "Unpin workspace" : "Pin workspace"}
              onClick={() => onTogglePin(workspace.id)}
            >
              {isPinned ? (
                <Pin className="h-3.5 w-3.5 fill-current" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span className="sr-only">Workspace options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(workspace)}>
                  Edit workspace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(workspace)}
                >
                  Delete workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Footer meta */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {projectCount} project{projectCount !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span>Created {format(new Date(workspace.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>
    </Card>
  );
}
