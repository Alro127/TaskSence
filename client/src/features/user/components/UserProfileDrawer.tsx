import { AlertCircle, CalendarDays, FolderKanban, Loader2, Mail, Phone, UserRound } from "lucide-react";
import { format } from "date-fns";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillsSection } from "./SkillsSection";
import { useGetUserByIdQuery } from "../api/userApi";
import { useGetPublicWorkspacesQuery } from "@/features/workspace/api/workspaceApi";
import { useGetMyWorkspacesQuery } from "@/features/workspace/api/workspaceApi";
import { WorkspaceExploreCard } from "@/features/workspace/components/WorkspaceExploreCard";
import type { User } from "@/types/api";

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserProfileDrawerProps {
  /** The ID of the user to show. Set to null / undefined to hide the drawer. */
  userId: number | null | undefined;
  open: boolean;
  onClose: () => void;
}

// ─── Helper: gender label ────────────────────────────────────────────────────

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

// ─── Helper: single info row ─────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UserProfileDrawer({ userId, open, onClose }: UserProfileDrawerProps) {
  const { data, isLoading, isError } = useGetUserByIdQuery(userId!, {
    skip: !userId,
  });

  const { data: publicWsData, isLoading: isWsLoading } = useGetPublicWorkspacesQuery(userId!, {
    skip: !userId,
  });

  const { data: myWsData } = useGetMyWorkspacesQuery();
  const myWorkspaceIds = new Set((myWsData?.data ?? []).map((w) => w.id));

  const publicWorkspaces = (publicWsData?.data ?? []).filter(
    (ws) => !myWorkspaceIds.has(ws.id)
  );

  const user = data?.data as User | undefined;
  const avatarInitial = (user?.fullName ?? user?.email ?? "?")[0].toUpperCase();
  const hasExtraInfo = !!(user?.bio || user?.phone || user?.gender || user?.dob);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        {/* ── Profile header ── */}
        <SheetHeader className="shrink-0 px-6 pb-4 pt-6">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName ?? "Avatar"}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  avatarInitial
                )}
              </div>
            )}
            <div className="min-w-0">
              <SheetTitle className="truncate text-lg leading-tight">
                {isLoading ? "Loading…" : (user?.fullName ?? "Unnamed User")}
              </SheetTitle>
              {user?.email && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>

        <Separator />

        {/* ── Body ── */}
        {isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load profile. Please try again.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="info" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 shrink-0">
              <TabsTrigger value="info" className="flex-1">
                Info
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex-1">
                Skills
              </TabsTrigger>
              <TabsTrigger value="workspaces" className="flex-1">
                Workspaces
              </TabsTrigger>
            </TabsList>

            {/* ── Info tab ── */}
            <TabsContent
              value="info"
              className="mt-0 flex-1 overflow-y-auto px-6 py-4"
            >
              {user?.bio && (
                <>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Bio
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {user.bio}
                  </p>
                  <Separator className="my-4" />
                </>
              )}

              <div className="space-y-1">
                <InfoRow icon={Mail} label="Email" value={user?.email} />
                <InfoRow icon={Phone} label="Phone" value={user?.phone} />
                <InfoRow
                  icon={UserRound}
                  label="Gender"
                  value={
                    user?.gender
                      ? (GENDER_LABELS[user.gender] ?? user.gender)
                      : null
                  }
                />
                <InfoRow
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={
                    user?.dob
                      ? format(new Date(user.dob), "MMMM d, yyyy")
                      : null
                  }
                />
              </div>

              {!hasExtraInfo && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No additional info available.
                </p>
              )}
            </TabsContent>

            {/* ── Skills tab ── */}
            <TabsContent
              value="skills"
              className="mt-0 flex-1 overflow-y-auto px-6 py-4"
            >
              {userId != null && <SkillsSection userId={userId} />}
            </TabsContent>

            {/* ── Workspaces tab ── */}
            <TabsContent
              value="workspaces"
              className="mt-0 flex-1 overflow-y-auto px-6 py-4"
            >
              {isWsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : publicWorkspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <FolderKanban className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No public workspaces to show.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicWorkspaces.map((ws) => (
                    <WorkspaceExploreCard key={ws.id} workspace={ws} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
