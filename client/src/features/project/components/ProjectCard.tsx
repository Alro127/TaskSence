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
    badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]",
  },
  ON_HOLD: {
    label: "On Hold",
    icon: Pause,
    badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]",
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
    <div
      className={cn(
        "group ghost-border relative cursor-pointer rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px] flex flex-col gap-3",
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 flex-1 text-[#1a1c1b]">
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
        <p className="text-xs text-[#444651] line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Progress bar */}
      {project.progress !== undefined && project.progress !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-[#444651]">
            <span>Progress</span>
            <span>{Math.round(project.progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(35,58,135,0.1)]">
            <div
              className="h-full rounded-full bg-[#233a87] transition-all"
              style={{ width: `${Math.min(project.progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[#444651] mt-auto pt-1">
        <div className="flex items-center gap-3">
          {memberCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          )}
          {project.taskCount !== undefined && project.taskCount !== null && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {project.taskCount} task{project.taskCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {project.endDate && (
          <span className="ml-auto">
            Due {format(new Date(project.endDate), "MMM d, yyyy")}
          </span>
        )}
      </div>
    </div>
  );
}
