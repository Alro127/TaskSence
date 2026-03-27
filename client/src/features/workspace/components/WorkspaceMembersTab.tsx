import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Loader2,
  MoreHorizontal,
  UserPlus,
  Users,
  Mail,
  Clock,
  Inbox,
  ShieldCheck,
  Shield,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
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
import { useGetWorkspaceJoinRequestsQuery, useReviewJoinRequestMutation } from "../api/workspaceJoinRequestApi";
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
    badgeClass: "bg-[rgba(100,51,0,0.08)] text-[#643300] border-[rgba(100,51,0,0.2)]",
  },
  MANAGER: {
    label: "Manager",
    icon: Shield,
    badgeClass: "bg-[rgba(35,58,135,0.08)] text-[#233a87] border-[rgba(35,58,135,0.2)]",
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

const ROLES_FOR_CHANGE: WorkspaceRole[] = ["MANAGER", "MEMBER", "VIEWER"];

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
    useGetWorkspaceInvitesQuery({ workspaceId, size: 50 });

  const members = membersData?.data?.data ?? [];
  const workspacePermissions = members[0]?.permissions ?? [];
  const hasWorkspacePermission = (...keys: string[]) =>
    keys.some((key) => workspacePermissions.includes(key));
  const canInvite = hasWorkspacePermission("INVITE_MEMBERS");
  const canReviewJoinRequests = hasWorkspacePermission("MANAGE_JOIN_REQUESTS");
  const canUpdateRoles = hasWorkspacePermission("MANAGE_MEMBERS");
  const canRemoveMembers = hasWorkspacePermission("MANAGE_MEMBERS");
  const canManageMembers = canUpdateRoles || canRemoveMembers;

  const { data: joinRequestsData, isLoading: joinRequestsLoading } =
    useGetWorkspaceJoinRequestsQuery({ workspaceId, size: 50 }, { skip: !canReviewJoinRequests });

  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateMemberRoleMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [revokeInvite, { isLoading: isRevoking }] = useRevokeInviteMutation();
  const [reviewJoinRequest] = useReviewJoinRequestMutation();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const pendingInvites = (invitesData?.data?.data ?? []).filter(
    (inv) => inv.status === "PENDING"
  );
  const pendingJoinRequests = (joinRequestsData?.data?.data ?? []).filter(
    (req) => req.status === "PENDING"
  );

  // ── Role change ────────────────────────────────────────────────────────────
  const handleRoleChange = async (member: WorkspaceMember, newRole: WorkspaceRole) => {
    try {
      await updateRole({
        workspaceId,
        memberId: member.id,
        role: newRole,
      }).unwrap();
      toast.success(`${member.user.fullName ?? member.user.email}'s role updated to ${ROLE_CONFIG[newRole].label}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update role"));
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to remove member"));
    }
  };

  // ── Review join request ────────────────────────────────────────────────────
  const handleReview = async (
    requestId: number,
    status: "APPROVED" | "REJECTED"
  ) => {
    setReviewingId(requestId);
    try {
      await reviewJoinRequest({
        requestId,
        workspaceId,
        body: { status },
      }).unwrap();
      toast.success(
        status === "APPROVED"
          ? "Join request approved"
          : "Join request rejected"
      );
      setExpandedRequestId(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to review request"));
    } finally {
      setReviewingId(null);
    }
  };

  // ── Revoke invite ──────────────────────────────────────────────────────────
  const handleRevoke = async (inviteId: number, email: string) => {
    try {
      await revokeInvite({ inviteId, workspaceId }).unwrap();
      toast.success(`Invitation to ${email} has been revoked`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to revoke invitation"));
    }
  };

  // ── Determine available roles for a target member ─────────────────────────
  const getAvailableRoles = (_target: WorkspaceMember): WorkspaceRole[] => {
    if (!canUpdateRoles) return [];
    // Role transition constraints are enforced by backend.
    return ROLES_FOR_CHANGE;
  };

  // ── Can manage a specific member ──────────────────────────────────────────
  const canManageMember = (target: WorkspaceMember): boolean => {
    if (target.user.id === currentUserId) return false; // can't manage yourself
    return canManageMembers;
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
        {canInvite && (
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
              const canChangeRole = manageable && canUpdateRoles && availableRoles.length > 0;
              const canRemove = manageable && canRemoveMembers;
              const hasActionMenu = canChangeRole || canRemove;

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
                  {hasActionMenu && (
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
                        {canChangeRole && (
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

                        {canChangeRole && canRemove && <DropdownMenuSeparator />}

                        {/* Remove */}
                        {canRemove && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setRemoveTarget(member)}
                          >
                            Remove from workspace
                          </DropdownMenuItem>
                        )}
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
      {canInvite && (
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

      {/* ── Join Requests section ── */}
      {canReviewJoinRequests && (
        <>
          <Separator />
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">
                Join Requests
                {pendingJoinRequests.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {pendingJoinRequests.length}
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                People requesting to join this workspace.
              </p>
            </div>

            {joinRequestsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : pendingJoinRequests.length === 0 ? (
              <div className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No pending join requests
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <ul className="divide-y">
                  {pendingJoinRequests.map((req) => {
                    const isExpanded = expandedRequestId === req.id;
                    const isReviewing = reviewingId === req.id;
                    return (
                      <li key={req.id} className="px-4 py-3">
                        {/* ── Row header ── */}
                        <div
                          className="flex cursor-pointer items-center gap-3"
                          onClick={() =>
                            setExpandedRequestId(
                              isExpanded ? null : req.id
                            )
                          }
                        >
                          {/* Avatar */}
                          <div className="shrink-0">
                            {req.user.avatarUrl ? (
                              <img
                                src={req.user.avatarUrl}
                                alt={req.user.fullName ?? req.user.email}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <AvatarFallback name={req.user.fullName} />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {req.user.fullName ?? req.user.email}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                Requested{" "}
                                {formatDistanceToNow(
                                  new Date(req.createdAt),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Expand toggle */}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>

                        {/* ── Expanded content ── */}
                        {isExpanded && (
                          <div className="mt-3 space-y-3 pl-12">
                            {req.message ? (
                              <div className="rounded-md bg-muted/50 px-3 py-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Message
                                </p>
                                <p className="text-sm">{req.message}</p>
                              </div>
                            ) : (
                              <p className="text-xs italic text-muted-foreground">
                                No message provided
                              </p>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="gap-1.5 bg-[#006a61] hover:opacity-90 text-white"
                                disabled={isReviewing}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReview(req.id, "APPROVED");
                                }}
                              >
                                {isReviewing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1.5"
                                disabled={isReviewing}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReview(req.id, "REJECTED");
                                }}
                              >
                                {isReviewing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
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
        onOpenChange={(open) => !open && !isRemoving && setRemoveTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {removeTarget?.user.fullName ?? removeTarget?.user.email}
              </span>{" "}
              from this workspace?
            </DialogDescription>
          </DialogHeader>

          {/* Warning box */}
          <div className="flex items-start gap-3 rounded-lg border border-[rgba(100,51,0,0.2)] bg-[rgba(100,51,0,0.06)] p-3 text-sm text-[#643300]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">This action cannot be undone</p>
              <p className="text-xs">
                They will immediately lose access to this workspace and all its
                projects. They can be re-invited later if needed.
              </p>
            </div>
          </div>

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
