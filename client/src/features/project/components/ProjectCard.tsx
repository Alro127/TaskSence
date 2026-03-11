import {
  Archive,
  CheckCircle2,
  Clock,
  MoreVertical,
  Pause,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
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
import type { Project, ProjectMemberRole, ProjectStatus } from "@/types/api";
import { format } from "date-fns";

// ─── Status config ──────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  ACTIVE: {
    label: "Active",
    icon: Clock,
    badgeClass: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: Pause,
    badgeClass: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    badgeClass: "text-muted-foreground bg-muted border-border",
  },
};

// ─── Role label helpers ─────────────────────────────────────────────────────────
export const ROLE_LABEL: Record<ProjectMemberRole, string> = {
  MANAGER: "Manager",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

interface ProjectCardProps {
  project: Project;
  workspaceId: number;
  workspaceName?: string;
  /** Current user's role in this project. If undefined, treat as read-only. */
  currentUserRole?: ProjectMemberRole;
  memberCount?: number;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function ProjectCard({
  project,
  workspaceId,
  workspaceName,
  currentUserRole,
  memberCount,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.ACTIVE;
  const StatusIcon = cfg.icon;
  const isManager = currentUserRole === "MANAGER";

  const handleCardClick = () => {
    navigate(`/workspaces/${workspaceId}/projects/${project.id}`, {
      state: { workspaceName, projectSnapshot: project },
    });
  };

  return (
    <Card
      className={cn(
        "group relative cursor-pointer rounded-lg p-0 gap-0 transition-all hover:shadow-md hover:-translate-y-0.5",
      )}
      onClick={handleCardClick}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 flex-1">
            {project.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                cfg.badgeClass,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>

            {/* 3-dot menu — only for MANAGER */}
            {isManager && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(project);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(project);
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-1">
          {memberCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          )}
          {project.endDate && (
            <span className="ml-auto">
              Due {format(new Date(project.endDate), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
