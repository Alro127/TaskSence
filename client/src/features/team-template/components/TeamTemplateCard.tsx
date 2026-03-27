import { format } from "date-fns";
import { Users, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamTemplate } from "@/types/api";

interface TeamTemplateCardProps {
  template: TeamTemplate;
  onEdit: (template: TeamTemplate) => void;
  onDelete: (template: TeamTemplate) => void;
}

export function TeamTemplateCard({
  template,
  onEdit,
  onDelete,
}: TeamTemplateCardProps) {
  const navigate = useNavigate();

  return (
    <div className="ghost-border cursor-pointer rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px]">
      {/* Clickable body */}
      <div
        className="flex-1 p-5"
        onClick={() => navigate(`/team-templates/${template.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
              <Users className="h-4 w-4 text-[#233a87]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1a1c1b] leading-tight">
                {template.name}
              </p>
              {template.description && (
                <p className="mt-1 line-clamp-2 text-xs text-[#444651]">
                  {template.description}
                </p>
              )}
            </div>
          </div>

          {/* 3-dot menu — stops propagation */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-[#444651]"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(template)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between bg-[#f4f3f1] px-5 py-3 rounded-b-xl">
        <span className="flex items-center gap-1.5 text-xs text-[#444651]">
          <Users className="h-3.5 w-3.5" />
          {template.memberCount} {template.memberCount === 1 ? "member" : "members"}
        </span>
        <span className="text-xs text-[#444651]">
          {format(new Date(template.createdAt), "MMM d, yyyy")}
        </span>
      </div>
    </div>
  );
}
