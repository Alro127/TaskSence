import { useState, useEffect } from "react";
import { Search, X, Loader2, CheckCircle2, AlertCircle, UserPlus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { UserSearchResult, AddTeamMemberResultItem } from "@/types/api";
import { useLazySearchUsersQuery } from "@/features/user/api/userApi";
import { useAddMembersMutation } from "../api/teamMemberTemplateApi";

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: number;
  /** Called after a successful batch add with a map of userId → UserSearchResult for ADDED users */
  onMembersAdded?: (userMap: Record<number, UserSearchResult>) => void;
}

const STATUS_LABEL: Record<string, string> = {
  ADDED: "Added",
  ALREADY_EXISTS: "Already a member",
  NOT_FOUND: "Not found",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ADDED: "default",
  ALREADY_EXISTS: "secondary",
  NOT_FOUND: "destructive",
};

export function AddMembersModal({
  open,
  onOpenChange,
  templateId,
  onMembersAdded,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [results, setResults] = useState<AddTeamMemberResultItem[] | null>(null);

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
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const handleRemoveSelected = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleAdd = async () => {
    if (selectedUsers.length === 0) return;
    try {
      const res = await addMembers({
        templateId,
        userIds: selectedUsers.map((u) => u.id),
      }).unwrap();
      setResults(res.data);

      const addedCount = res.data.filter((r) => r.status === "ADDED").length;
      if (addedCount > 0) {
        toast.success(`${addedCount} member${addedCount > 1 ? "s" : ""} added successfully!`);
        // Build userMap for added users and notify parent
        if (onMembersAdded) {
          const userMap: Record<number, UserSearchResult> = {};
          res.data
            .filter((r) => r.status === "ADDED")
            .forEach((r) => {
              const user = selectedUsers.find((u) => u.id === r.userId);
              if (user) userMap[user.id] = user;
            });
          onMembersAdded(userMap);
        }
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

  const filteredResults = searchResults.filter(
    (u) => !selectedUsers.find((s) => s.id === u.id),
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Members
          </DialogTitle>
        </DialogHeader>

        {/* Result view after batch add */}
        {results ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Results for {results.length} user
              {results.length > 1 ? "s" : ""}:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((item) => {
                const user = selectedUsers.find((u) => u.id === item.userId);
                return (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.fullName ?? user?.email ?? `User #${item.userId}`}
                      </p>
                      {user?.email && user?.fullName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      {item.status === "ADDED" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant={STATUS_VARIANT[item.status] ?? "secondary"} className="text-xs">
                        {STATUS_LABEL[item.status] ?? item.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          /* Search & select view */
          <div className="space-y-4">
            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {user.fullName ?? user.email}
                    <button
                      type="button"
                      onClick={() => handleRemoveSelected(user.id)}
                      className="rounded-full hover:bg-primary/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Search results dropdown */}
            {debouncedQuery.trim().length >= 2 && (
              <div className="max-h-48 overflow-y-auto rounded-md border bg-popover shadow-sm">
                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredResults.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No users found.
                  </p>
                ) : (
                  filteredResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors",
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                        {(user.fullName ?? user.email)?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0">
                        {user.fullName && (
                          <p className="truncate text-sm font-medium">
                            {user.fullName}
                          </p>
                        )}
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={selectedUsers.length === 0 || isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
