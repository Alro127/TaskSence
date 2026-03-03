import { format } from "date-fns";
import { Users, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import type { TeamTemplate } from "@/types/api";

interface TeamTemplateCardProps {
  template: TeamTemplate;
  memberCount?: number;
  onEdit: (template: TeamTemplate) => void;
  onDelete: (template: TeamTemplate) => void;
}

export function TeamTemplateCard({
  template,
  memberCount = 0,
  onEdit,
  onDelete,
}: TeamTemplateCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="cursor-pointer rounded-lg p-0 gap-0 transition-shadow hover:shadow-md">
      {/* Clickable body */}
      <div
        className="flex-1 p-5"
        onClick={() => navigate(`/team-templates/${template.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">
                {template.name}
              </p>
              {template.description && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
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
                  className="h-7 w-7 shrink-0 text-muted-foreground"
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
      <div className="flex items-center justify-between border-t px-5 py-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(template.createdAt), "MMM d, yyyy")}
        </span>
      </div>
    </Card>
  );
}
