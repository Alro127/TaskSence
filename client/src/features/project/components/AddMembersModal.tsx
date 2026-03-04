import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus, X, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  UserSearchResult,
} from "@/types/api";
import { useLazySearchUsersQuery } from "@/features/user/api/userApi";
import { useAddMembersMutation } from "../api/projectMemberApi";
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

interface SelectedUser extends UserSearchResult {
  role: ProjectMemberRole;
}

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onMembersAdded?: () => void;
}

export function AddMembersModal({
  open,
  onOpenChange,
  projectId,
  onMembersAdded,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [results, setResults] = useState<AddProjectMemberResultItem[] | null>(null);

  const [searchUsers, { data: searchData, isFetching: isSearching }] =
    useLazySearchUsersQuery();
  const [addMembers, { isLoading: isAdding }] = useAddMembersMutation();

  const searchResults = searchData?.data ?? [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      searchUsers(debouncedQuery.trim());
    }
  }, [debouncedQuery, searchUsers]);

  const handleSelectUser = (user: UserSearchResult) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, { ...user, role: "MEMBER" }]);
    }
    setSearchQuery("");
    setDebouncedQuery("");
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
    setDebouncedQuery("");
    setSelectedUsers([]);
    setResults(null);
    onOpenChange(false);
  };

  const isAlreadySelected = (userId: number) =>
    selectedUsers.some((u) => u.id === userId);

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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search results dropdown */}
            {debouncedQuery.trim().length >= 2 && searchResults.length > 0 && (
              <div className="rounded-md border bg-popover shadow-md">
                {searchResults.map((user) => {
                  const already = isAlreadySelected(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      disabled={already}
                      onClick={() => handleSelectUser(user)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-md last:rounded-b-md",
                        already
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
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {user.fullName ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      {already && (
                        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                          Selected
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {debouncedQuery.trim().length >= 2 &&
              !isSearching &&
              searchResults.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-3">
                  No users found for &ldquo;{debouncedQuery}&rdquo;
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
                    {/* Avatar */}
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

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {user.fullName ?? user.email}
                      </p>
                    </div>

                    {/* Role selector */}
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

                    {/* Remove chip */}
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
