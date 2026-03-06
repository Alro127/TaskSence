import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  AddProjectMemberResultItem,
  ProjectMemberRole,
  WorkspaceMember,
} from "@/types/api";
import { useGetWorkspaceMembersQuery } from "@/features/workspace/api/workspaceMemberApi";
import { useAddMembersMutation, useGetMembersQuery } from "../api/projectMemberApi";
import { ROLE_LABEL } from "./ProjectCard";

const ROLE_OPTIONS: ProjectMemberRole[] = ["MANAGER", "MEMBER", "VIEWER"];

const ADD_STATUS_CONFIG: Record<
  AddProjectMemberResultItem["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  CREATED: {
    label: "Added",
    icon: CheckCircle2,
    className: "text-green-600 bg-green-50 border-green-200",
  },
  RESTORED: {
    label: "Restored",
    icon: RefreshCw,
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  ALREADY_EXISTS: {
    label: "Already a member",
    icon: AlertCircle,
    className: "text-amber-600 bg-amber-50 border-amber-200",
  },
  NOT_FOUND: {
    label: "Not found",
    icon: AlertCircle,
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
};

interface SelectedUser {
  id: number;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: ProjectMemberRole;
}

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  workspaceId: number;
  onMembersAdded?: () => void;
}

export function AddMembersModal({
  open,
  onOpenChange,
  projectId,
  workspaceId,
  onMembersAdded,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [results, setResults] = useState<AddProjectMemberResultItem[] | null>(null);

  // Fetch workspace members (source of truth) and existing project members
  const { data: workspaceMembersData, isLoading: isLoadingMembers } =
    useGetWorkspaceMembersQuery(workspaceId, { skip: !open });
  const { data: projectMembersData } = useGetMembersQuery(projectId, { skip: !open });
  const [addMembers, { isLoading: isAdding }] = useAddMembersMutation();

  const workspaceMembers = workspaceMembersData?.data ?? [];
  const projectMemberIds = useMemo(
    () => new Set((projectMembersData?.data ?? []).map((m) => m.user.id)),
    [projectMembersData],
  );

  // Client-side filter by name or email
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workspaceMembers;
    return workspaceMembers.filter((wm) => {
      const name = (wm.user.fullName ?? "").toLowerCase();
      const email = wm.user.email.toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [workspaceMembers, searchQuery]);

  const isAlreadySelected = (userId: number) =>
    selectedUsers.some((u) => u.id === userId);

  const isAlreadyInProject = (userId: number) => projectMemberIds.has(userId);

  const handleSelectUser = (wm: WorkspaceMember) => {
    const { user } = wm;
    if (!isAlreadySelected(user.id) && !isAlreadyInProject(user.id)) {
      setSelectedUsers((prev) => [
        ...prev,
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: "MEMBER",
        },
      ]);
    }
  };

  const handleRemoveSelected = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRoleChange = (userId: number, role: ProjectMemberRole) => {
    setSelectedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u)),
    );
  };

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return;
    try {
      const res = await addMembers({
        projectId,
        members: selectedUsers.map((u) => ({ userId: u.id, role: u.role })),
      }).unwrap();
      setResults(res.data);

      const addedCount = res.data.filter(
        (r) => r.status === "CREATED" || r.status === "RESTORED",
      ).length;
      if (addedCount > 0) {
        toast.success(`${addedCount} member${addedCount > 1 ? "s" : ""} added successfully!`);
        onMembersAdded?.();
      }
    } catch {
      toast.error("Failed to add members. Please try again.");
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedUsers([]);
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Members
          </DialogTitle>
        </DialogHeader>

        {results ? (
          /* ── Results view ── */
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Results:</p>
            <div className="space-y-2">
              {results.map((result) => {
                const user = selectedUsers.find((u) => u.id === result.userId);
                const cfg = ADD_STATUS_CONFIG[result.status];
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={result.userId}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName ?? user.email}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          {((user?.fullName ?? user?.email) ?? "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user?.fullName ?? user?.email ?? `User #${result.userId}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                        cfg.className,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          /* ── Search & select view ── */
          <div className="space-y-4 py-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search workspace members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isLoadingMembers && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Workspace members list */}
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading workspace members...</span>
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="max-h-[220px] overflow-y-auto rounded-md border bg-popover">
                {filteredMembers.map((wm) => {
                  const { user } = wm;
                  const alreadySelected = isAlreadySelected(user.id);
                  const alreadyInProject = isAlreadyInProject(user.id);
                  const disabled = alreadySelected || alreadyInProject;
                  return (
                    <button
                      key={wm.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectUser(wm)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md",
                        disabled
                          ? "opacity-50 cursor-default"
                          : "hover:bg-accent cursor-pointer",
                      )}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName ?? user.email}
                          className="h-7 w-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {(user.fullName ?? user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{user.fullName ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      {alreadyInProject && (
                        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                          In project
                        </Badge>
                      )}
                      {alreadySelected && !alreadyInProject && (
                        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                          Selected
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : workspaceMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <Users className="h-8 w-8 opacity-30" />
                <p className="text-sm">This workspace has no members yet</p>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No members match &ldquo;{searchQuery}&rdquo;
              </p>
            )}

            {/* Selected users with role picker */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  To be added ({selectedUsers.length})
                </p>
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName ?? user.email}
                        className="h-7 w-7 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {(user.fullName ?? user.email).charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.fullName ?? user.email}
                      </p>
                    </div>

                    <Select
                      value={user.role}
                      onValueChange={(val) =>
                        handleRoleChange(user.id, val as ProjectMemberRole)
                      }
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() => handleRemoveSelected(user.id)}
                      className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={selectedUsers.length === 0 || isAdding}
              >
                {isAdding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
