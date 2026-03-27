import { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Loader2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Users,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { WorkspaceRole, BulkInviteResult, UserSearchResult } from "@/types/api";
import { useLazySearchUsersQuery } from "@/features/user/api/userApi";
import { useGetMyTemplatesQuery } from "@/features/team-template/api/teamTemplateApi";
import { useGetMembersQuery } from "@/features/team-template/api/teamMemberTemplateApi";
import { UserProfileDrawer } from "@/features/user/components/UserProfileDrawer";
import { useBulkInviteMembersMutation } from "../api/workspaceInviteApi";

// ─── Types ────────────────────────────────────────────────────────────────────
interface InviteEntry {
  email: string;
  name?: string;
  avatarUrl?: string;
  role: WorkspaceRole;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: "MANAGER", label: "Manager" },
  { value: "MEMBER", label: "Member" },
  { value: "VIEWER", label: "Viewer" },
];

const ROLE_CLASSES: Record<WorkspaceRole, string> = {
  OWNER: "text-[#643300]",
  MANAGER: "text-[#233a87]",
  MEMBER: "text-[#444651]",
  VIEWER: "text-[#444651]",
};

const emailSchema = z.string().email();

// ─── Role Select (small, inline) ──────────────────────────────────────────────
function RoleSelect({
  value,
  onChange,
}: {
  value: WorkspaceRole;
  onChange: (r: WorkspaceRole) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as WorkspaceRole)}>
      <SelectTrigger className={cn("h-7 w-28 text-xs", ROLE_CLASSES[value])}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Avatar fallback ──────────────────────────────────────────────────────────
function MiniAvatar({
  avatarUrl,
  name,
  email,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  email: string;
}) {
  const initial = (name ?? email)?.[0]?.toUpperCase() ?? "?";
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name ?? email}
      className="h-7 w-7 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initial}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BulkInviteModalProps {
  workspaceId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BulkInviteModal({
  workspaceId,
  open,
  onOpenChange,
}: BulkInviteModalProps) {
  // ── Invite list state ──────────────────────────────────────────────────────
  const [inviteList, setInviteList] = useState<InviteEntry[]>([]);
  const [defaultRole, setDefaultRole] = useState<WorkspaceRole>("MEMBER");

  // ── Search state ───────────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Template import state ──────────────────────────────────────────────────
  const [templateSectionOpen, setTemplateSectionOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateChecks, setTemplateChecks] = useState<Record<string, boolean>>({});

  // ── Result state ───────────────────────────────────────────────────────────
  const [result, setResult] = useState<BulkInviteResult | null>(null);

  // ── Profile drawer ─────────────────────────────────────────────────────────
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  // ── APIs ───────────────────────────────────────────────────────────────────
  const [searchUsers, { data: searchData, isFetching: isSearching }] =
    useLazySearchUsersQuery();
  const { data: templatesData } = useGetMyTemplatesQuery({ page: 0, size: 50 });
  const { data: templateMembersData, isFetching: isFetchingMembers } =
    useGetMembersQuery(
      { templateId: selectedTemplateId ?? 0, page: 0, size: 100 },
      { skip: selectedTemplateId === null },
    );
  const [bulkInvite, { isLoading: isSubmitting }] = useBulkInviteMembersMutation();

  const searchResults: UserSearchResult[] = searchData?.data ?? [];
  const templates = templatesData?.data?.data ?? [];
  const templateMembers = templateMembersData?.data?.data ?? [];

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(inputValue.trim()), 350);
    return () => clearTimeout(t);
  }, [inputValue]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchUsers(debouncedQuery);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [debouncedQuery, searchUsers]);

  // Reset template checks when template changes
  useEffect(() => {
    setTemplateChecks({});
  }, [selectedTemplateId]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isAlreadyAdded = (email: string) =>
    inviteList.some((e) => e.email.toLowerCase() === email.toLowerCase());

  const filteredSearchResults = searchResults.filter(
    (u) => !isAlreadyAdded(u.email),
  );

  const showDirectAdd =
    emailSchema.safeParse(inputValue.trim()).success &&
    !isAlreadyAdded(inputValue.trim());

  // ── Actions ────────────────────────────────────────────────────────────────
  const addEntry = (entry: Omit<InviteEntry, "role">) => {
    if (isAlreadyAdded(entry.email)) return;
    setInviteList((prev) => [...prev, { ...entry, role: defaultRole }]);
    setInputValue("");
    setDebouncedQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const addDirectEmail = () => {
    const email = inputValue.trim();
    if (!emailSchema.safeParse(email).success) return;
    addEntry({ email });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSearchResults.length === 1) {
        // Convenience: if only 1 result and it's exact email match
        const u = filteredSearchResults[0];
        addEntry({ email: u.email, name: u.fullName ?? undefined, avatarUrl: u.avatarUrl ?? undefined });
      } else if (showDirectAdd) {
        addDirectEmail();
      }
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const removeEntry = (email: string) => {
    setInviteList((prev) => prev.filter((e) => e.email !== email));
  };

  const updateRole = (email: string, role: WorkspaceRole) => {
    setInviteList((prev) =>
      prev.map((e) => (e.email === email ? { ...e, role } : e)),
    );
  };

  // Update default role + apply to entries that still have the old default
  const handleDefaultRoleChange = (newRole: WorkspaceRole) => {
    const old = defaultRole;
    setDefaultRole(newRole);
    setInviteList((prev) =>
      prev.map((e) => (e.role === old ? { ...e, role: newRole } : e)),
    );
  };

  // ── Template actions ───────────────────────────────────────────────────────
  const allTemplateChecked =
    templateMembers.length > 0 &&
    templateMembers.every((m) => templateChecks[m.userSummaryResponse.email]);

  const toggleAllTemplate = () => {
    if (allTemplateChecked) {
      setTemplateChecks({});
    } else {
      const next: Record<string, boolean> = {};
      templateMembers.forEach((m) => {
        next[m.userSummaryResponse.email] = true;
      });
      setTemplateChecks(next);
    }
  };

  const addSelectedFromTemplate = () => {
    const toAdd = templateMembers.filter(
      (m) => templateChecks[m.userSummaryResponse.email],
    );
    let added = 0;
    toAdd.forEach((m) => {
      const u = m.userSummaryResponse;
      if (!isAlreadyAdded(u.email)) {
        setInviteList((prev) => [
          ...prev,
          {
            email: u.email,
            name: u.fullName ?? undefined,
            avatarUrl: u.avatarUrl ?? undefined,
            role: defaultRole,
          },
        ]);
        added++;
      }
    });
    setTemplateChecks({});
    if (added > 0) toast.info(`${added} member${added > 1 ? "s" : ""} added to invite list`);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (inviteList.length === 0) return;
    try {
      const res = await bulkInvite({
        workspaceId,
        invites: inviteList.map((e) => ({ email: e.email, role: e.role })),
      }).unwrap();
      setResult(res.data);
      const sc = res.data.success.length;
      if (sc > 0) {
        toast.success(`${sc} invitation${sc > 1 ? "s" : ""} sent successfully!`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send invitations"));
    }
  };

  // ── Reset & close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setInviteList([]);
    setDefaultRole("MEMBER");
    setInputValue("");
    setDebouncedQuery("");
    setShowDropdown(false);
    setTemplateSectionOpen(false);
    setSelectedTemplateId(null);
    setTemplateChecks({});
    setResult(null);
    onOpenChange(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── Result view ──────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invitation Results
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {/* Success */}
              {result.success.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#006a61] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {result.success.length} invitation{result.success.length > 1 ? "s" : ""} sent
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-[rgba(0,106,97,0.2)] p-2 bg-[rgba(0,106,97,0.04)]">
                    {result.success.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-[#006a61]" />
                        <span className="truncate font-medium">{inv.email}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {inv.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed */}
              {result.failed.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    {result.failed.length} failed
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border border-destructive/20 p-2 bg-destructive/5">
                    {result.failed.map((f) => (
                      <div key={f.email} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
                        <div className="min-w-0">
                          <span className="font-medium truncate block">{f.email}</span>
                          <span className="text-xs text-muted-foreground">{f.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <UserProfileDrawer
          userId={profileUserId}
          open={!!profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── Main view ───────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  const checkedCount = Object.values(templateChecks).filter(Boolean).length;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
          {/* ── Header ── */}
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Members
            </DialogTitle>
          </DialogHeader>

          {/* ── Two-column body ── */}
          <div className="grid grid-cols-2 divide-x min-h-[420px] max-h-[520px]">
            {/* ── LEFT PANEL: Add People ── */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
                {/* Search input */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Search or enter email
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      placeholder="Name or email address..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => debouncedQuery.length >= 2 && setShowDropdown(true)}
                      className="pl-9 h-9"
                      autoFocus
                    />
                  </div>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
                      {isSearching ? (
                        <div className="flex items-center justify-center p-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          {filteredSearchResults.length === 0 && !showDirectAdd && (
                            <p className="p-3 text-center text-xs text-muted-foreground">
                              No registered users found.
                            </p>
                          )}

                          {/* Registered users */}
                          {filteredSearchResults.slice(0, 6).map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors"
                            >
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                onClick={() => setProfileUserId(user.id)}
                              >
                                <MiniAvatar
                                  avatarUrl={user.avatarUrl}
                                  name={user.fullName}
                                  email={user.email}
                                />
                                <div className="min-w-0">
                                  {user.fullName && (
                                    <p className="truncate text-xs font-medium hover:text-primary hover:underline">
                                      {user.fullName}
                                    </p>
                                  )}
                                  <p className="truncate text-xs text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  addEntry({
                                    email: user.email,
                                    name: user.fullName ?? undefined,
                                    avatarUrl: user.avatarUrl ?? undefined,
                                  })
                                }
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-bold"
                                title="Add to invite list"
                              >
                                +
                              </button>
                            </div>
                          ))}

                          {/* Direct email add */}
                          {showDirectAdd && (
                            <>
                              {filteredSearchResults.length > 0 && (
                                <Separator />
                              )}
                              <button
                                type="button"
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-left"
                                onClick={addDirectEmail}
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium">
                                    Invite{" "}
                                    <span className="text-primary">
                                      "{inputValue.trim()}"
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Unregistered user
                                  </p>
                                </div>
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Import from template */}
                <div>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setTemplateSectionOpen((v) => !v)}
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Import from Team Template
                    </span>
                    {templateSectionOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {templateSectionOpen && (
                    <div className="mt-3 space-y-3">
                      {templates.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          No team templates found.
                        </p>
                      ) : (
                        <>
                          {/* Template select */}
                          <Select
                            value={selectedTemplateId?.toString() ?? ""}
                            onValueChange={(v) =>
                              setSelectedTemplateId(v ? Number(v) : null)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map((t) => (
                                <SelectItem
                                  key={t.id}
                                  value={t.id.toString()}
                                  className="text-xs"
                                >
                                  {t.name}
                                  <span className="ml-1 text-muted-foreground">
                                    ({t.memberCount})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Member checklist */}
                          {selectedTemplateId !== null && (
                            <div>
                              {isFetchingMembers ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              ) : templateMembers.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-3">
                                  This template has no members.
                                </p>
                              ) : (
                                <>
                                  {/* Select all toggle */}
                                  <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                                    onClick={toggleAllTemplate}
                                  >
                                    {allTemplateChecked ? (
                                      <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <Square className="h-3.5 w-3.5" />
                                    )}
                                    {allTemplateChecked ? "Deselect all" : "Select all"}
                                  </button>

                                  {/* Member rows */}
                                  <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-md border">
                                    {templateMembers.map((m) => {
                                      const u = m.userSummaryResponse;
                                      const alreadyAdded = isAlreadyAdded(u.email);
                                      const checked = !!templateChecks[u.email];
                                      return (
                                        <button
                                          key={m.id}
                                          type="button"
                                          disabled={alreadyAdded}
                                          className={cn(
                                            "flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                            alreadyAdded
                                              ? "opacity-40 cursor-not-allowed"
                                              : "hover:bg-accent cursor-pointer",
                                            checked && !alreadyAdded && "bg-primary/5",
                                          )}
                                          onClick={() => {
                                            if (alreadyAdded) return;
                                            setTemplateChecks((prev) => ({
                                              ...prev,
                                              [u.email]: !prev[u.email],
                                            }));
                                          }}
                                        >
                                          {alreadyAdded ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#006a61]" />
                                          ) : checked ? (
                                            <CheckSquare className="h-3.5 w-3.5 shrink-0 text-primary" />
                                          ) : (
                                            <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                          )}
                                          <MiniAvatar
                                            avatarUrl={u.avatarUrl}
                                            name={u.fullName}
                                            email={u.email}
                                          />
                                          <div className="min-w-0">
                                            <p className="truncate text-xs font-medium">
                                              {u.fullName ?? u.email}
                                            </p>
                                            {u.fullName && (
                                              <p className="truncate text-xs text-muted-foreground">
                                                {u.email}
                                              </p>
                                            )}
                                          </div>
                                          {alreadyAdded && (
                                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                              Added
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Add selected button */}
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 w-full h-8 text-xs"
                                    disabled={checkedCount === 0}
                                    onClick={addSelectedFromTemplate}
                                  >
                                    Add Selected{checkedCount > 0 ? ` (${checkedCount})` : ""}
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL: Invite List ── */}
            <div className="flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b flex items-center justify-between gap-3 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  Invite list
                  {inviteList.length > 0 && (
                    <span className="ml-1 text-foreground">
                      ({inviteList.length})
                    </span>
                  )}
                </span>
                {/* Default role */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">Default:</span>
                  <Select
                    value={defaultRole}
                    onValueChange={(v) =>
                      handleDefaultRoleChange(v as WorkspaceRole)
                    }
                  >
                    <SelectTrigger className="h-6 w-24 text-xs border-dashed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {inviteList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-5 py-10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        No invitees yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Search or enter email on the left
                      </p>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {inviteList.map((entry) => (
                      <li
                        key={entry.email}
                        className="flex items-center gap-2 px-4 py-2.5"
                      >
                        <MiniAvatar
                          avatarUrl={entry.avatarUrl}
                          name={entry.name}
                          email={entry.email}
                        />
                        <div className="min-w-0 flex-1">
                          {entry.name ? (
                            <>
                              <p className="truncate text-xs font-medium">
                                {entry.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {entry.email}
                              </p>
                            </>
                          ) : (
                            <p className="truncate text-xs font-medium">
                              {entry.email}
                            </p>
                          )}
                        </div>
                        <RoleSelect
                          value={entry.role}
                          onChange={(r) => updateRole(entry.email, r)}
                        />
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.email)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={inviteList.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send{" "}
                  {inviteList.length > 0
                    ? `${inviteList.length} Invitation${inviteList.length > 1 ? "s" : ""}`
                    : "Invitations"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UserProfileDrawer
        userId={profileUserId}
        open={!!profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </>
  );
}
