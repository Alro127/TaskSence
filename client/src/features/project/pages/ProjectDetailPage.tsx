import { useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronRight,
  ListTodo,
  Loader2,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Settings,
  LayoutGrid,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { JoinRequestStatus, ProjectJoinRequest } from "@/types/api";

import { useGetProjectByIdQuery, useGetCurrentUserRoleQuery } from "../api/projectApi";
import { useGetWorkspaceByIdQuery } from "@/features/workspace/api/workspaceApi";
import { useGetMembersQuery } from "../api/projectMemberApi";
import { useGetJoinRequestsQuery, useReviewJoinRequestMutation } from "../api/projectJoinRequestApi";
import {
  DeleteProjectDialog,
  EditProjectModal,
  AddMembersModal,
  MemberCard,
  STATUS_CONFIG,
  ROLE_LABEL,
} from "../components";

// ─── Join Request Status config ─────────────────────────────────────────────────
const JOIN_STATUS_CONFIG: Record<
  JoinRequestStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: "Pending",
    badgeClass: "text-amber-600 bg-amber-50 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "text-green-600 bg-green-50 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    badgeClass: "text-destructive bg-destructive/10 border-destructive/20",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "text-muted-foreground bg-muted border-border",
  },
};

// ─── Join Request Item ───────────────────────────────────────────────────────────
function JoinRequestItem({
  request,
  canReview,
}: {
  request: ProjectJoinRequest;
  canReview: boolean;
}) {
  const [reviewRequest, { isLoading }] = useReviewJoinRequestMutation();
  const cfg = JOIN_STATUS_CONFIG[request.status];

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    try {
      await reviewRequest({
        projectId: request.projectId,
        requestId: request.id,
        status,
      }).unwrap();
      toast.success(`Request ${status === "APPROVED" ? "approved" : "rejected"}.`);
    } catch {
      toast.error("Failed to review request.");
    }
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      {/* Avatar */}
      {request.user.avatarUrl ? (
        <img
          src={request.user.avatarUrl}
          alt={request.user.fullName ?? request.user.email}
          className="h-10 w-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
          {(request.user.fullName ?? request.user.email).charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">
            {request.user.fullName ?? request.user.email}
          </p>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              cfg.badgeClass,
            )}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{request.user.email}</p>
        {request.message && (
          <p className="text-sm text-muted-foreground italic mt-1">
            &ldquo;{request.message}&rdquo;
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(new Date(request.createdAt), "MMM d, yyyy · HH:mm")}
        </p>
      </div>

      {/* Actions — only for PENDING and if user can manage */}
      {canReview && request.status === "PENDING" && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 hover:bg-green-50"
            disabled={isLoading}
            onClick={() => handleReview("APPROVED")}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={isLoading}
            onClick={() => handleReview("REJECTED")}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export function ProjectDetailPage() {
  const { id: workspaceIdStr, projectId: projectIdStr } = useParams<{
    id: string;
    projectId: string;
  }>();
  const workspaceId = Number(workspaceIdStr);
  const projectId = Number(projectIdStr);
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceNameFromState = (location.state as { workspaceName?: string } | null)?.workspaceName;

  const currentUserId = useAppSelector((s) => s.user.currentUser?.id ?? 0);

  // ── Data queries ──
  const {
    data: projectData,
    isLoading: isProjectLoading,
    isError: isProjectError,
  } = useGetProjectByIdQuery(
    { workspaceId, projectId },
    { skip: isNaN(workspaceId) || isNaN(projectId) },
  );
  const project = projectData?.data ?? null;

  const { data: roleData } = useGetCurrentUserRoleQuery(projectId, {
    skip: isNaN(projectId),
  });
  const currentUserRole = roleData?.data ?? undefined;
  const isManager = currentUserRole === "MANAGER";

  const { data: workspaceData } = useGetWorkspaceByIdQuery(workspaceId, {
    skip: isNaN(workspaceId) || !!workspaceNameFromState,
  });
  const workspaceName = workspaceNameFromState ?? workspaceData?.data?.name ?? "Workspace";

  const { data: membersData, isLoading: isMembersLoading } =
    useGetMembersQuery(projectId, { skip: isNaN(projectId) });
  const members = membersData?.data ?? [];

  const { data: joinRequestsData, isLoading: isJoinRequestsLoading } =
    useGetJoinRequestsQuery(projectId, {
      skip: isNaN(projectId) || !isManager,
    });
  const joinRequests = joinRequestsData?.data ?? [];
  const pendingCount = joinRequests.filter((r) => r.status === "PENDING").length;

  // ── Modal states ──
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);

  // ── Loading ──
  if (isProjectLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error / Not found ──
  if (isProjectError || !project) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/workspaces/${workspaceId}`)}
        >
          Back to Workspace
        </Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[project.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
        <Link to="/workspaces" className="hover:text-foreground transition-colors">
          Workspaces
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/workspaces/${workspaceId}`}
          className="hover:text-foreground transition-colors"
        >
          {workspaceName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{project.name}</span>
      </nav>

      {/* ── Project Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  cfg.badgeClass,
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {cfg.label}
              </span>
            </div>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
            {currentUserRole && (
              <p className="mt-1 text-xs text-muted-foreground">
                Your role:{" "}
                <span className="font-medium text-foreground">
                  {ROLE_LABEL[currentUserRole]}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Header actions — MANAGER only */}
        {isManager && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
            {members.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {members.length}
              </Badge>
            )}
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="join-requests" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Join Requests
              {pendingCount > 0 && (
                <Badge className="text-xs bg-amber-500 hover:bg-amber-500 text-white">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-6 max-w-2xl space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Project Information</h3>
            <Separator />

            <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      cfg.badgeClass,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Members
                </dt>
                <dd className="mt-1 flex items-center gap-1 text-sm">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </dd>
              </div>

              {project.startDate && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-sm">
                    {format(new Date(project.startDate), "MMM d, yyyy")}
                  </dd>
                </div>
              )}

              {project.endDate && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Due Date
                  </dt>
                  <dd className="mt-1 flex items-center gap-1 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(project.endDate), "MMM d, yyyy")}
                  </dd>
                </div>
              )}

              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Created
                </dt>
                <dd className="mt-1 text-sm">
                  {format(new Date(project.createdAt), "MMM d, yyyy · HH:mm")}
                </dd>
              </div>

              {project.description && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                  </dd>
                </div>
              )}
            </dl>

            {isManager && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit Project
                </Button>
              </>
            )}
          </Card>
        </TabsContent>

        {/* ── Tasks Tab ── */}
        <TabsContent value="tasks" className="mt-6">
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
            <ListTodo className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Task management</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Task boards and tracking will be available in a future sprint.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── Members Tab ── */}
        <TabsContent value="members" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            {isManager && (
              <Button size="sm" onClick={() => setIsAddMembersOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Members
              </Button>
            )}
          </div>

          {isMembersLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No members yet</p>
                {isManager && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add team members to get started.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  canManage={isManager}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Join Requests Tab (MANAGER only) ── */}
        {isManager && (
          <TabsContent value="join-requests" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pendingCount} pending · {joinRequests.length} total
              </p>
            </div>

            {isJoinRequestsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No join requests</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requests will appear here when users ask to join.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Pending first */}
                {joinRequests
                  .slice()
                  .sort((a, b) => {
                    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
                    if (a.status !== "PENDING" && b.status === "PENDING") return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map((request) => (
                    <JoinRequestItem
                      key={request.id}
                      request={request}
                      canReview={isManager}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ── Modals ── */}
      <EditProjectModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        project={project}
        workspaceId={workspaceId}
      />

      <DeleteProjectDialog
        project={project}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={() => navigate(`/workspaces/${workspaceId}`)}
      />

      <AddMembersModal
        open={isAddMembersOpen}
        onOpenChange={setIsAddMembersOpen}
        projectId={projectId}
        workspaceId={workspaceId}
        onMembersAdded={() => setIsAddMembersOpen(false)}
      />
    </div>
  );
}
