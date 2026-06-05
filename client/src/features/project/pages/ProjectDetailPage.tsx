import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowRightLeft,
  ChevronRight,
  ListTodo,
  Lock,
  Loader2,
  LogOut,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  AlertTriangle,
  Settings,
  LayoutGrid,
  ClipboardList,
  Flag,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Tags,
  BarChart2,
} from "lucide-react";
import { format } from "date-fns";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { JoinRequestStatus, ProjectJoinRequest, ProjectMember } from "@/types/api";

import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useGetProjectByIdQuery } from "../api/projectApi";
import { useGetWorkspaceByIdQuery } from "@/features/workspace/api/workspaceApi";
import { useGetMembersQuery, useUpdateMemberRoleMutation, useLeaveProjectMutation } from "../api/projectMemberApi";
import { useGetJoinRequestsQuery, useReviewJoinRequestMutation, useCancelJoinRequestMutation } from "../api/projectJoinRequestApi";
import { useGetTasksByProjectQuery } from "@/features/task/api/taskApi";
import { ProjectAnalyticsTab } from "@/features/analytics/components/ProjectAnalyticsTab";
import { useCreateWorkflowDraftFromProjectMutation, useGetGuidanceByProjectQuery } from "@/features/workflow/api/workflowApi";
import { CreateWorkflowDraftCard } from "@/features/workflow/components";
import { useGuidance } from "@/features/guidance/context/GuidanceContext";
import { GuidanceTarget } from "@/features/guidance/components/GuidanceTarget";
import {
  DeleteProjectDialog,
  EditProjectModal,
  AddMembersModal,
  MemberCard,
  RequestJoinProjectDialog,
  STATUS_CONFIG,
  ROLE_LABEL,
  SprintManagementTab,
  ProjectTagsTab,
} from "../components";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// ─── Join Request Status config ─────────────────────────────────────────────────
const JOIN_STATUS_CONFIG: Record<
  JoinRequestStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: "Pending",
    badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]",
  },
  APPROVED: {
    label: "Approved",
    badgeClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]",
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to review request."));
    }
  };

  return (
    <div className="flex flex-wrap items-start gap-4 rounded-lg border p-4">
      {/* Avatar */}
      {request.user.avatarUrl ? (
        <img
          src={request.user.avatarUrl}
          alt={request.user.fullName ?? request.user.email}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
          {(request.user.fullName ?? request.user.email).charAt(0).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1" style={{ minWidth: "160px" }}>
        <div className="flex flex-wrap items-center gap-2">
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
          <p className="mt-1 text-sm italic text-muted-foreground">
            &ldquo;{request.message}&rdquo;
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(new Date(request.createdAt), "MMM d, yyyy · HH:mm")}
        </p>
      </div>

      {/* Actions — only for PENDING and if user can manage */}
      {canReview && request.status === "PENDING" && (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-[#006a61] border-[rgba(0,106,97,0.2)] hover:bg-[rgba(0,106,97,0.06)]"
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

// ─── Transfer Manager Dialog ─────────────────────────────────────────────────
function TransferManagerDialog({
  open,
  onOpenChange,
  projectId,
  sourceManagerId,
  members,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  sourceManagerId: number | null;
  members: ProjectMember[];
}) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [updateRole, { isLoading }] = useUpdateMemberRoleMutation();

  const candidates = members.filter((m) => m.role !== "MANAGER");

  const handleClose = () => {
    setSelectedUserId(null);
    onOpenChange(false);
  };

  const handleTransfer = async () => {
    if (!selectedUserId || !sourceManagerId) return;
    try {
      await updateRole({ projectId, userId: selectedUserId, role: "MANAGER" }).unwrap();
      await updateRole({ projectId, userId: sourceManagerId, role: "MEMBER" }).unwrap();
      toast.success("Manager role transferred successfully.");
      handleClose();
      window.location.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to transfer manager role."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Manager Role</DialogTitle>
          <DialogDescription>
            Select a member to become the new project manager. The current manager will be moved to Member role.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No other members to transfer to.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {candidates.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedUserId(m.user.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  selectedUserId === m.user.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                {m.user.avatarUrl ? (
                  <img
                    src={m.user.avatarUrl}
                    alt={m.user.fullName ?? m.user.email}
                    className="h-8 w-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {(m.user.fullName ?? m.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{m.user.fullName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {ROLE_LABEL[m.role]}
                </Badge>
                {selectedUserId === m.user.id && (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button disabled={!selectedUserId || isLoading} onClick={handleTransfer}>
            {isLoading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "overview";
  const [memberPage, setMemberPage] = useState(0);
  const MEMBER_PAGE_SIZE = 12;
  const [joinRequestPage, setJoinRequestPage] = useState(0);
  const JOIN_REQUEST_PAGE_SIZE = 10;
  const workspaceNameFromState = (location.state as { workspaceName?: string; projectSnapshot?: import("@/types/api").Project } | null)?.workspaceName;
  const projectSnapshot = (location.state as { projectSnapshot?: import("@/types/api").Project } | null)?.projectSnapshot ?? null;

  const currentUserId = useAppSelector((s) => s.user.currentUser?.id ?? 0);

  // ── Data queries ──
  const {
    data: projectData,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
  } = useGetProjectByIdQuery(
    { workspaceId, projectId },
    { skip: isNaN(workspaceId) || isNaN(projectId) },
  );
  const project = projectData?.data ?? null;
  const projectErrorStatus = projectError && "status" in projectError
    ? (projectError as FetchBaseQueryError).status
    : undefined;
  const isProjectForbidden = projectErrorStatus === 403;

  // Member-only endpoints are queried only when the user can access project detail.
  const skipMemberOnlyQueries = isNaN(projectId) || !project;

  const { data: workspaceData } = useGetWorkspaceByIdQuery(workspaceId, {
    skip: isNaN(workspaceId) || !!workspaceNameFromState,
  });
  const workspaceName = workspaceNameFromState ?? workspaceData?.data?.name ?? "Workspace";

  const { data: membersData, isLoading: isMembersLoading } =
    useGetMembersQuery(
      { projectId, page: memberPage, size: MEMBER_PAGE_SIZE },
      { skip: skipMemberOnlyQueries },
    );
  const members = membersData?.data?.data ?? [];
  const totalMembers = membersData?.data?.totalElements ?? 0;
  const totalMemberPages = membersData?.data?.totalPages ?? 1;

  // All members for TransferManagerDialog (needs all non-manager candidates)
  const { data: allMembersData } = useGetMembersQuery(
    { projectId, page: 0, size: 100 },
    { skip: skipMemberOnlyQueries },
  );
  const allMembers = allMembersData?.data?.data ?? [];

  const currentUserMember = allMembers.find((m) => m.user.id === currentUserId);
  const projectPermissions = project?.permissions ?? currentUserMember?.permissions ?? [];
  const hasProjectPermission = (...keys: string[]) =>
    keys.some((key) => projectPermissions.includes(key));
  const canManageProject =
    hasProjectPermission("UPDATE", "DELETE");
  const canManageMembers =
    hasProjectPermission("MANAGE_MEMBERS");
  const canReviewJoinRequests =
    hasProjectPermission("MANAGE_MEMBERS");
  const canManageSprints =
    hasProjectPermission("MANAGE_SPRINT", "CREATE_SPRINT", "UPDATE_SPRINT", "DELETE_SPRINT");
  const canManageTags =
    hasProjectPermission("MANAGE_TAG", "CREATE_TAG", "UPDATE_TAG", "DELETE_TAG");
  const canCreateWorkflowDraft = hasProjectPermission("VIEW_TASKS");

  const { data: joinRequestsData, isLoading: isJoinRequestsLoading } =
    useGetJoinRequestsQuery(
      { projectId, page: joinRequestPage, size: JOIN_REQUEST_PAGE_SIZE },
      { skip: skipMemberOnlyQueries || !canReviewJoinRequests },
    );
  const joinRequests = joinRequestsData?.data?.data ?? [];
  const joinRequestsTotalElements = joinRequestsData?.data?.totalElements ?? 0;
  const joinRequestsTotalPages = joinRequestsData?.data?.totalPages ?? 1;
  const pendingCount = joinRequestsTotalElements;

  const { data: tasksData, isLoading: isTasksLoading } = useGetTasksByProjectQuery(
    { projectId, page: 0, size: 200 },
    { skip: skipMemberOnlyQueries },
  );
  const tasks = tasksData?.data?.data ?? [];

  // ── Modal states ──
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [isTransferManagerOpen, setIsTransferManagerOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState<number | null>(null);
  const [localJoinRequest, setLocalJoinRequest] = useState<ProjectJoinRequest | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isLeaveProjectOpen, setIsLeaveProjectOpen] = useState(false);
  const [isCreateWorkflowDialogOpen, setIsCreateWorkflowDialogOpen] = useState(false);
  const [includeSubtasks, setIncludeSubtasks] = useState(true);
  const [includeCompletedTasks, setIncludeCompletedTasks] = useState(false);
  const [useAiRefinement, setUseAiRefinement] = useState(false);
  const [cancelJoinRequest, { isLoading: isCancellingJoin }] = useCancelJoinRequestMutation();
  const [leaveProject, { isLoading: isLeavingProject }] = useLeaveProjectMutation();
  const [createWorkflowDraftFromProject, { isLoading: isCreatingWorkflowDraft }] =
    useCreateWorkflowDraftFromProjectMutation();

  const { startGuidance } = useGuidance();
  const { data: guidanceData } = useGetGuidanceByProjectQuery(
    { projectId },
    { skip: skipMemberOnlyQueries }
  );

  useEffect(() => {
    if (guidanceData?.data && project) {
      // Small delay to ensure targets have mounted
      const timer = setTimeout(() => {
        startGuidance(guidanceData.data);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [guidanceData, project, startGuidance]);

  const handleLeaveProject = async () => {
    try {
      await leaveProject({ workspaceId, projectId }).unwrap();
      toast.success("You have left the project.");
      navigate(`/workspaces/${workspaceId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to leave project."));
    }
  };

  const handleCreateWorkflowDraft = async () => {
    try {
      const response = await createWorkflowDraftFromProject({
        projectId,
        body: {
          includeSubtasks,
          includeCompletedTasks,
          useAiRefinement,
        },
      }).unwrap();

      toast.success("Workflow draft created successfully.");
      setIsCreateWorkflowDialogOpen(false);
      navigate(`/workflows/${response.data.id}`, {
        state: { workflow: response.data },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create workflow draft."));
    }
  };

  // ── Loading ──
  if (isProjectLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Non-access view (check BEFORE not-found handling) ──
  if (isProjectForbidden) {
    const displayProject = project ?? projectSnapshot;
    if (!displayProject) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">You don&apos;t have access to this project.</p>
          <Button variant="outline" size="sm" onClick={() => navigate(`/workspaces/${workspaceId}`)}>
            Back to Workspace
          </Button>
        </div>
      );
    }

    const displayCfg = STATUS_CONFIG[displayProject.status];
    const DisplayStatusIcon = displayCfg.icon;

    const handleCancelJoinRequest = async () => {
      if (!localJoinRequest) return;
      try {
        await cancelJoinRequest({
          projectId: displayProject.id,
          requestId: localJoinRequest.id,
        }).unwrap();
        toast.success("Join request cancelled.");
        setLocalJoinRequest(null);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Failed to cancel join request."));
      }
    };

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
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
          <span className="text-foreground font-medium">{displayProject.name}</span>
        </nav>

        {/* Project Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{displayProject.name}</h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  displayCfg.badgeClass,
                )}
              >
                <DisplayStatusIcon className="h-3 w-3" />
                {displayCfg.label}
              </span>
            </div>
            {displayProject.description && (
              <p className="mt-1 text-sm text-muted-foreground">{displayProject.description}</p>
            )}
          </div>
        </div>

        {/* Non-member Banner */}
        {!localJoinRequest ? (
          <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">You are not a member of this project</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send a join request to the project manager to gain access to tasks and collaboration tools.
              </p>
            </div>
            <Button size="sm" onClick={() => setIsJoinDialogOpen(true)}>
              Request to join
            </Button>
          </div>
        ) : localJoinRequest.status === "PENDING" ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[rgba(100,51,0,0.2)] bg-[rgba(100,51,0,0.06)] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(100,51,0,0.10)]">
              <Clock className="h-5 w-5 text-[#643300]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#643300]">Join request pending</p>
              <p className="text-xs text-[#643300]/80 mt-0.5">
                Your request has been sent. You'll be notified once the manager reviews it.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-muted-foreground"
              disabled={isCancellingJoin}
              onClick={handleCancelJoinRequest}
            >
              {isCancellingJoin ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Cancel request
            </Button>
          </div>
        ) : localJoinRequest.status === "REJECTED" ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">Join request rejected</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your previous request was not approved. You may send a new request.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsJoinDialogOpen(true)}>
              Send again
            </Button>
          </div>
        ) : null}

        {/* Read-only Project Overview */}
        <Card className="p-6 space-y-4 max-w-2xl">
          <h3 className="text-lg font-semibold">Project Information</h3>
          <Separator />
          <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    displayCfg.badgeClass,
                  )}
                >
                  <DisplayStatusIcon className="h-3 w-3" />
                  {displayCfg.label}
                </span>
              </dd>
            </div>
            {displayProject.startDate && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</dt>
                <dd className="mt-1 text-sm">{format(new Date(displayProject.startDate), "MMM d, yyyy")}</dd>
              </div>
            )}
            {displayProject.endDate && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</dt>
                <dd className="mt-1 flex items-center gap-1 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {format(new Date(displayProject.endDate), "MMM d, yyyy")}
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</dt>
              <dd className="mt-1 text-sm">{format(new Date(displayProject.createdAt), "MMM d, yyyy · HH:mm")}</dd>
            </div>
            {displayProject.description && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</dt>
                <dd className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {displayProject.description}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <RequestJoinProjectDialog
          project={displayProject}
          open={isJoinDialogOpen}
          onOpenChange={setIsJoinDialogOpen}
          onSuccess={(req) => setLocalJoinRequest(req)}
        />
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
      <div className="flex flex-wrap items-start justify-between gap-4">
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
          </div>
        </div>

        {/* Header actions — MANAGER only */}
        {canManageProject && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
      <Tabs defaultValue={defaultTab}>
        <div className="overflow-x-auto hide-scrollbar">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="sprints" className="gap-2">
            <Flag className="h-4 w-4" />
            Sprints
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
            {totalMembers > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalMembers}
              </Badge>
            )}
          </TabsTrigger>
          {canReviewJoinRequests && (
            <TabsTrigger value="join-requests" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Join Requests
              {pendingCount > 0 && (
                <Badge className="text-xs bg-[#643300] hover:bg-[#643300] text-white">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart2 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        </div>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="ghost-border rounded-xl bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)] space-y-4">
                <h3 className="text-base font-semibold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}>Project Information</h3>
                <div className="h-px bg-[#efeeec]" />

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
                      {totalMembers} member{totalMembers !== 1 ? "s" : ""}
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

                {canManageProject && (
                  <>
                    <div className="h-px bg-[#efeeec]" />
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
              </div>
            </div>

            {canCreateWorkflowDraft && (
              <div className="xl:col-span-4 xl:sticky xl:top-24 h-fit">
                <CreateWorkflowDraftCard
                  onCreateDraft={() => setIsCreateWorkflowDialogOpen(true)}
                  onViewWorkflows={() => navigate("/workflows")}
                  disabled={isCreatingWorkflowDraft}
                />
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tasks Tab ── */}
        <TabsContent value="tasks" className="mt-6 space-y-6">
          {isTasksLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* ── Stats grid ── */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <Card className="p-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </Card>
                <div className="ghost-border rounded-xl p-4 space-y-1 bg-white border-l-4 border-l-[#444651]">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#444651]">Todo</p>
                  <p className="text-2xl font-bold text-[#444651]">
                    {tasks.filter((t) => t.status === "TODO").length}
                  </p>
                </div>
                <div className="ghost-border rounded-xl p-4 space-y-1 bg-white border-l-4 border-l-[#233a87]">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#444651]">In Progress</p>
                  <p className="text-2xl font-bold text-[#233a87]">
                    {tasks.filter((t) => t.status === "IN_PROGRESS").length}
                  </p>
                </div>
                <div className="ghost-border rounded-xl p-4 space-y-1 bg-white border-l-4 border-l-[#643300]">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#444651]">Review</p>
                  <p className="text-2xl font-bold text-[#643300]">
                    {tasks.filter((t) => t.status === "REVIEW").length}
                  </p>
                </div>
                <div className="ghost-border rounded-xl p-4 space-y-1 bg-white border-l-4 border-l-[#006a61]">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#444651]">Done</p>
                  <p className="text-2xl font-bold text-[#006a61]">
                    {tasks.filter((t) => t.status === "DONE").length}
                  </p>
                </div>
              </div>

              {/* ── Progress bar ── */}
              {tasks.length > 0 && (() => {
                const done = tasks.filter((t) => t.status === "DONE").length;
                const pct = Math.round((done / tasks.length) * 100);
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Completion</span>
                      <span className="font-medium text-foreground">{done}/{tasks.length} tasks done</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#006a61] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">{pct}% complete</p>
                  </div>
                );
              })()}

              {/* ── CTA ── */}
              <div className="flex items-center justify-between ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div>
                  <p className="text-sm font-medium">Task Board</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Manage tasks with List and Kanban views, filters, and more.
                  </p>
                </div>
                <GuidanceTarget capability="CREATE_TASK">
                  <Button
                    onClick={() =>
                      navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)
                    }
                  >
                    <ListTodo className="mr-2 h-4 w-4" />
                    Open Task Board
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </GuidanceTarget>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Sprints Tab ── */}
        <TabsContent value="sprints" className="mt-6 space-y-6">
          <SprintManagementTab
            workspaceId={workspaceId}
            projectId={projectId}
            isManager={canManageSprints}
          />
        </TabsContent>

        {/* ── Tags Tab ── */}
        <TabsContent value="tags" className="mt-6 space-y-6">
          <ProjectTagsTab projectId={projectId} isManager={canManageTags} />
        </TabsContent>

        {/* ── Members Tab ── */}
        <TabsContent value="members" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalMembers} member{totalMembers !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              {currentUserMember && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => setIsLeaveProjectOpen(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Project
                </Button>
              )}
              {canManageMembers && (
                <Button size="sm" onClick={() => setIsAddMembersOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Members
                </Button>
              )}
            </div>
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
                {canManageMembers && (
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
                  canManage={canManageMembers}
                  currentUserId={currentUserId}
                  onTransferManager={(managerId) => {
                    setTransferSourceId(managerId);
                    setIsTransferManagerOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {totalMemberPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setMemberPage((p) => Math.max(0, p - 1))}
                    aria-disabled={memberPage === 0}
                    className={memberPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: totalMemberPages }, (_, i) => {
                  const showPage =
                    i === 0 ||
                    i === totalMemberPages - 1 ||
                    Math.abs(i - memberPage) <= 1;
                  if (!showPage) {
                    if (i === 1 || i === totalMemberPages - 2) {
                      return (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={i === memberPage}
                        onClick={() => setMemberPage(i)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setMemberPage((p) => Math.min(totalMemberPages - 1, p + 1))}
                    aria-disabled={memberPage === totalMemberPages - 1}
                    className={memberPage === totalMemberPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        {/* ── Join Requests Tab (MANAGER only) ── */}
        {canReviewJoinRequests && (
          <TabsContent value="join-requests" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {joinRequestsTotalElements} pending join request{joinRequestsTotalElements !== 1 ? "s" : ""}
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
              <>
              <div className="space-y-3">
                {joinRequests.map((request) => (
                  <JoinRequestItem
                    key={request.id}
                    request={request}
                    canReview={canReviewJoinRequests}
                  />
                ))}
              </div>

              {joinRequestsTotalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setJoinRequestPage((p) => Math.max(0, p - 1))}
                        aria-disabled={joinRequestPage === 0}
                        className={joinRequestPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: joinRequestsTotalPages }, (_, i) => {
                      const showPage =
                        i === 0 ||
                        i === joinRequestsTotalPages - 1 ||
                        Math.abs(i - joinRequestPage) <= 1;
                      if (!showPage) {
                        if (i === 1 || i === joinRequestsTotalPages - 2) {
                          return (
                            <PaginationItem key={`ellipsis-${i}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={i === joinRequestPage}
                            onClick={() => setJoinRequestPage(i)}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setJoinRequestPage((p) => Math.min(joinRequestsTotalPages - 1, p + 1))}
                        aria-disabled={joinRequestPage === joinRequestsTotalPages - 1}
                        className={joinRequestPage === joinRequestsTotalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
              </>
            )}
          </TabsContent>
        )}

        {/* ── Analytics Tab ── */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <ProjectAnalyticsTab
            projectId={projectId}
            showMemberWorkload={canManageMembers}
            members={allMembers}
          />
        </TabsContent>
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

      <TransferManagerDialog
        open={isTransferManagerOpen}
        onOpenChange={setIsTransferManagerOpen}
        projectId={projectId}
        sourceManagerId={transferSourceId}
        members={allMembers}
      />

      {/* ── Leave Project Dialog ── */}
      <Dialog
        open={isLeaveProjectOpen}
        onOpenChange={(open) => !open && !isLeavingProject && setIsLeaveProjectOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave project</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this project?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3 rounded-lg border border-[rgba(100,51,0,0.2)] bg-[rgba(100,51,0,0.06)] p-3 text-sm text-[#643300]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">You will lose access immediately</p>
              <p className="text-xs">
                You will be removed from this project and lose access to its tasks and sprints.
                A project manager can re-add you later if needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLeaveProjectOpen(false)}
              disabled={isLeavingProject}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveProject}
              disabled={isLeavingProject}
            >
              {isLeavingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Leave Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateWorkflowDialogOpen}
        onOpenChange={(open) => !isCreatingWorkflowDraft && setIsCreateWorkflowDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create draft from this project?</DialogTitle>
            <DialogDescription>
              This creates a new editable workflow draft based on <span className="font-semibold text-[#233a87]">{project.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border border-[rgba(197,197,211,0.35)] bg-[#faf9f7] p-4">
            <label className="flex items-start gap-2 text-sm text-[#1a1c1b]">
              <input
                type="checkbox"
                checked={includeSubtasks}
                onChange={(event) => setIncludeSubtasks(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[rgba(197,197,211,0.35)]"
                disabled={isCreatingWorkflowDraft}
              />
              Include subtasks
            </label>

            <label className="flex items-start gap-2 text-sm text-[#1a1c1b]">
              <input
                type="checkbox"
                checked={includeCompletedTasks}
                onChange={(event) => setIncludeCompletedTasks(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[rgba(197,197,211,0.35)]"
                disabled={isCreatingWorkflowDraft}
              />
              Include completed tasks
            </label>

            <label className="flex items-start gap-2 text-sm text-[#1a1c1b]">
              <input
                type="checkbox"
                checked={useAiRefinement}
                onChange={(event) => setUseAiRefinement(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[rgba(197,197,211,0.35)]"
                disabled={isCreatingWorkflowDraft}
              />
              Request AI refinement
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateWorkflowDialogOpen(false)}
              disabled={isCreatingWorkflowDraft}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#233a87] text-white hover:opacity-90"
              onClick={handleCreateWorkflowDraft}
              disabled={isCreatingWorkflowDraft}
            >
              {isCreatingWorkflowDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
