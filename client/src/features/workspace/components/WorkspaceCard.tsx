import { format } from "date-fns";
import { FolderKanban, MoreVertical, Pin, PinOff, Globe, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
  canEdit?: boolean;
  canDelete?: boolean;
}

export function WorkspaceCard({
  workspace,
  isPinned,
  onTogglePin,
  onEdit,
  onDelete,
  projectCount = 0,
  variant = "default",
  canEdit = false,
  canDelete = false,
}: WorkspaceCardProps) {
  const navigate = useNavigate();
  const hasActionMenu = canEdit || canDelete;

  return (
    <div
      className={cn(
        "ghost-border cursor-pointer rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px]",
        variant === "pinned" && "bg-[rgba(35,58,135,0.04)]",
      )}
    >
      {/* Clickable body */}
      <div
        className="flex-1 p-5"
        onClick={() => navigate(`/workspaces/${workspace.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Icon + Name + Description */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
              <FolderKanban className="h-5 w-5 text-[#233a87]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate text-[#1a1c1b]">{workspace.name}</h3>
              <p className="text-xs text-[#444651] truncate mt-0.5">
                {workspace.description ?? "No description"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(isPinned && "text-[#643300] hover:text-[#643300]")}
              title={isPinned ? "Unpin workspace" : "Pin workspace"}
              onClick={() => onTogglePin(workspace.id)}
            >
              {isPinned ? (
                <Pin className="h-3.5 w-3.5 fill-current" />
              ) : (
                <PinOff className="h-3.5 w-3.5" />
              )}
            </Button>

            {hasActionMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="sr-only">Workspace options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(workspace)}>
                      Edit workspace
                    </DropdownMenuItem>
                  )}
                  {canEdit && canDelete && <DropdownMenuSeparator />}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(workspace)}
                    >
                      Delete workspace
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Footer meta */}
        <div className="mt-4 flex items-center gap-2 text-xs text-[#444651]">
          <span>
            {projectCount} project{projectCount !== 1 ? "s" : ""}
          </span>
          <span>·</span>
          <span>Created {format(new Date(workspace.createdAt), "MMM d, yyyy")}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            {workspace.isPublic ? (
              <>
                <Globe className="h-3 w-3" />
                Public
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Private
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
