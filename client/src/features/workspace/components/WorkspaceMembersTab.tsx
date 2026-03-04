import { useState } from "react";
import {
  Loader2,
  MoreHorizontal,
  UserPlus,
  Users,
  Mail,
  Clock,
  ShieldCheck,
  Shield,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/app/hooks";
import { UserProfileDrawer } from "@/features/user/components/UserProfileDrawer";
import { useGetWorkspaceMembersQuery, useUpdateMemberRoleMutation, useRemoveMemberMutation } from "../api/workspaceMemberApi";
import { useGetWorkspaceInvitesQuery, useRevokeInviteMutation } from "../api/workspaceInviteApi";
import { BulkInviteModal } from "./BulkInviteModal";
import type { WorkspaceMember, WorkspaceRole } from "@/types/api";

// ─── Role config ────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  WorkspaceRole,
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  OWNER: {
    label: "Owner",
    icon: ShieldCheck,
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  MANAGER: {
    label: "Manager",
    icon: Shield,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  MEMBER: {
    label: "Member",
    icon: Users,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  VIEWER: {
    label: "Viewer",
    icon: Eye,
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

const ROLES_FOR_CHANGE: WorkspaceRole[] = ["OWNER", "MANAGER", "MEMBER", "VIEWER"];

// ─── Helper: avatar fallback ─────────────────────────────────────────────────
function AvatarFallback({ name }: { name: string | null }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface WorkspaceMembersTabProps {
  workspaceId: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function WorkspaceMembersTab({ workspaceId }: WorkspaceMembersTabProps) {
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id);

  const { data: membersData, isLoading: membersLoading } =
    useGetWorkspaceMembersQuery(workspaceId);

  const { data: invitesData, isLoading: invitesLoading } =
    useGetWorkspaceInvitesQuery(workspaceId);

  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateMemberRoleMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [revokeInvite, { isLoading: isRevoking }] = useRevokeInviteMutation();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    member: WorkspaceMember;
    newRole: WorkspaceRole;
  } | null>(null);

  const members = membersData?.data ?? [];
  const pendingInvites = (invitesData?.data ?? []).filter(
    (inv) => inv.status === "PENDING"
  );

  // Detect current user's role
  const myMember = members.find((m) => m.user.id === currentUserId);
  const myRole = myMember?.role ?? null;
  const canManage = myRole === "OWNER" || myRole === "MANAGER";

  // ── Role change ────────────────────────────────────────────────────────────
  const handleRoleChange = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
    try {
      await updateRole({
        workspaceId,
        memberId: member.id,
        role: newRole,
      }).unwrap();
      toast.success(`${member.user.fullName ?? member.user.email}'s role updated to ${ROLE_CONFIG[newRole].label}`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to update role");
    } finally {
      setPendingRoleChange(null);
    }
  };

  // ── Remove member ──────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeMember({
        workspaceId,
        memberId: removeTarget.id,
      }).unwrap();
      toast.success(`${removeTarget.user.fullName ?? removeTarget.user.email} has been removed`);
      setRemoveTarget(null);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to remove member");
    }
  };

  // ── Revoke invite ──────────────────────────────────────────────────────────
  const handleRevoke = async (inviteId: number, email: string) => {
    try {
      await revokeInvite({ inviteId, workspaceId }).unwrap();
      toast.success(`Invitation to ${email} has been revoked`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message ?? "Failed to revoke invitation");
    }
  };

  // ── Determine available roles for a target member ─────────────────────────
  const getAvailableRoles = (target: WorkspaceMember): WorkspaceRole[] => {
    if (myRole === "OWNER") return ROLES_FOR_CHANGE;
    // MANAGER can only change MEMBER and VIEWER roles, and only to MEMBER/VIEWER
    if (myRole === "MANAGER" && (target.role === "MEMBER" || target.role === "VIEWER")) {
      return ["MEMBER", "VIEWER"];
    }
    return [];
  };

  // ── Can manage a specific member ──────────────────────────────────────────
  const canManageMember = (target: WorkspaceMember): boolean => {
    if (target.user.id === currentUserId) return false; // can't manage yourself
    if (myRole === "OWNER") return true;
    if (myRole === "MANAGER" && (target.role === "MEMBER" || target.role === "VIEWER")) return true;
    return false;
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (membersLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">
            Members
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage who has access to this workspace and their permissions.
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* ── Members list ── */}
      <div className="rounded-lg border">
        {members.length === 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center p-6">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No members yet</p>
          </div>
        ) : (
          <ul className="divide-y">
            {members.map((member) => {
              const cfg = ROLE_CONFIG[member.role];
              const RoleIcon = cfg.icon;
              const availableRoles = getAvailableRoles(member);
              const manageable = canManageMember(member);

              return (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar */}
                  <button
                    className="shrink-0 rounded-full hover:ring-2 hover:ring-primary/40 transition-all"
                    onClick={() => setProfileUserId(member.user.id)}
                  >
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={member.user.fullName ?? member.user.email}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback name={member.user.fullName} />
                    )}
                  </button>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left"
                      onClick={() => setProfileUserId(member.user.id)}
                    >
                      {member.user.fullName ?? member.user.email}
                      {member.user.id === currentUserId && (
                        <span className="ml-1 text-xs text-muted-foreground font-normal">
                          (you)
                        </span>
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user.email}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}
                  >
                    <RoleIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>

                  {/* Actions */}
                  {manageable && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          disabled={isUpdatingRole || isRemoving}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Member actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* Change Role submenu */}
                        {availableRoles.length > 0 && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Change role
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {availableRoles.map((role) => {
                                const roleCfg = ROLE_CONFIG[role];
                                const RIcon = roleCfg.icon;
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    disabled={member.role === role}
                                    onSelect={() =>
                                      handleRoleChange(member, role)
                                    }
                                    className="gap-2"
                                  >
                                    <RIcon className="h-4 w-4 text-muted-foreground" />
                                    {roleCfg.label}
                                    {member.role === role && (
                                      <span className="ml-auto text-xs text-muted-foreground">
                                        Current
                                      </span>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}

                        <DropdownMenuSeparator />

                        {/* Remove */}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setRemoveTarget(member)}
                        >
                          Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Pending Invites section ── */}
      {canManage && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  Pending Invitations
                  {pendingInvites.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {pendingInvites.length} pending
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Invitations waiting to be accepted.
                </p>
              </div>
            </div>

            {invitesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                <Mail className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No pending invitations
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <ul className="divide-y">
                  {pendingInvites.map((invite) => {
                    const cfg = ROLE_CONFIG[invite.role];
                    const RoleIcon = cfg.icon;
                    return (
                      <li
                        key={invite.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {/* Email icon */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{invite.email}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Expires{" "}
                              {formatDistanceToNow(new Date(invite.expiredAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Role badge */}
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>

                        {/* Revoke button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={isRevoking}
                          onClick={() => handleRevoke(invite.id, invite.email)}
                        >
                          Revoke
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Bulk Invite Modal ── */}
      <BulkInviteModal
        workspaceId={workspaceId}
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />

      {/* ── Remove Confirmation Dialog ── */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {removeTarget?.user.fullName ?? removeTarget?.user.email}
              </span>{" "}
              from this workspace? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── User Profile Drawer ── */}
      <UserProfileDrawer
        userId={profileUserId}
        open={!!profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </div>
  );
}
