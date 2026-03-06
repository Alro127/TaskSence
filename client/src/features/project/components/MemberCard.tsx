import { AlertTriangle, CrownIcon, EyeIcon, MoreVertical, Trash2, User2Icon, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProjectMember, ProjectMemberRole } from "@/types/api";
import { useRemoveMemberMutation, useUpdateMemberRoleMutation } from "../api/projectMemberApi";
import { ROLE_LABEL } from "./ProjectCard";

const ROLE_ICON: Record<ProjectMemberRole, React.ElementType> = {
  MANAGER: CrownIcon,
  MEMBER: User2Icon,
  VIEWER: EyeIcon,
};

const ROLE_BADGE: Record<ProjectMemberRole, string> = {
  MANAGER: "bg-primary/10 text-primary border-primary/20",
  MEMBER: "bg-muted text-muted-foreground border-border",
  VIEWER: "bg-muted/60 text-muted-foreground/80 border-border",
};

interface MemberCardProps {
  member: ProjectMember;
  /** Whether the current user has MANAGER role (to show management actions). */
  canManage: boolean;
  /** The current user's own id, to prevent self-removal. */
  currentUserId: number;
}

export function MemberCard({ member, canManage, currentUserId }: MemberCardProps) {
  const [updateRole, { isLoading: isUpdating }] = useUpdateMemberRoleMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [open, setOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const RoleIcon = ROLE_ICON[member.role];
  const isSelf = member.user.id === currentUserId;

  const handleRoleChange = async (role: ProjectMemberRole) => {
    if (role === member.role) return;
    try {
      await updateRole({
        projectId: member.projectId,
        userId: member.user.id,
        role,
      }).unwrap();
      toast.success(`Role updated to ${ROLE_LABEL[role]}`);
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember({
        projectId: member.projectId,
        userId: member.user.id,
      }).unwrap();
      toast.success(`${member.user.fullName ?? member.user.email} removed from project.`);
      setIsRemoveDialogOpen(false);
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  return (
    <div className="group relative flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-shadow hover:shadow-sm">
      {/* Avatar */}
      <div className="relative">
        {member.user.avatarUrl ? (
          <img
            src={member.user.avatarUrl}
            alt={member.user.fullName ?? member.user.email}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
            {(member.user.fullName ?? member.user.email).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name & email */}
      <div className="min-w-0 w-full">
        <p className="text-sm font-medium truncate">
          {member.user.fullName ?? "—"}
          {isSelf && (
            <span className="ml-1 text-xs text-muted-foreground font-normal">(you)</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
      </div>

      {/* Role badge */}
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          ROLE_BADGE[member.role],
        )}
      >
        <RoleIcon className="h-3 w-3" />
        {ROLE_LABEL[member.role]}
      </span>

      {/* Management dropdown */}
      {canManage && !isSelf && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={isUpdating || isRemoving}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Change role
              </DropdownMenuLabel>
              {(["MANAGER", "MEMBER", "VIEWER"] as ProjectMemberRole[]).map(
                (role) => (
                  <DropdownMenuItem
                    key={role}
                    className={cn(member.role === role && "font-semibold")}
                    onClick={() => handleRoleChange(role)}
                  >
                    <UserCog className="mr-2 h-3.5 w-3.5" />
                    {ROLE_LABEL[role]}
                    {member.role === role && (
                      <span className="ml-auto text-xs text-muted-foreground">current</span>
                    )}
                  </DropdownMenuItem>
                ),
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => {
                  setOpen(false);
                  setIsRemoveDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove from project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* ── Remove Confirmation Dialog ── */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={(o) => !isRemoving && setIsRemoveDialogOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {member.user.fullName ?? member.user.email}
              </span>{" "}
              from this project?
            </DialogDescription>
          </DialogHeader>

          {/* Warning box */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">This action cannot be undone</p>
              <p className="text-xs">
                They will immediately lose access to all tasks and project data.
                They can be re-added later if needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
