import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  MoreHorizontal,
  Plus,
  SquarePen,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

import { useAppSelector } from "@/app/hooks";
import { GuidanceTarget } from "@/features/guidance/components/GuidanceTarget";
import { useGuidance } from "@/features/guidance/context/GuidanceContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { TaskPriority, TaskStatus, UserSummaryResponse } from "@/types/api";

import {
  useGetTaskByIdQuery,
  useGetSubTasksQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useCreateTaskMutation,
} from "../api/taskApi";
import { useGetMembersQuery } from "@/features/project/api/projectMemberApi";
import { TaskFormSheet } from "../components/TaskFormSheet";
import { TaskTagSelector } from "../components/TaskTagSelector";
import { CommentSection } from "../components/CommentSection";
import { AttachmentSection } from "../components/AttachmentSection";
import { useGetWorkspaceByIdQuery } from "@/features/workspace/api/workspaceApi";
import {
  useGetCurrentUserRoleQuery,
  useGetProjectByIdQuery,
} from "@/features/project/api/projectApi";
import { useGetProjectSprintsQuery } from "@/features/sprint/api/sprintApi";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; badgeClass: string }[] = [
  { value: "TODO", label: "Todo", badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]" },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]",
  },
  { value: "REVIEW", label: "Review", badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]" },
  { value: "DONE", label: "Done", badgeClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; badgeClass: string }[] = [
  { value: "LOW", label: "Low", badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]" },
  { value: "MEDIUM", label: "Medium", badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]" },
  { value: "HIGH", label: "High", badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]" },
  {
    value: "URGENT",
    label: "Urgent",
    badgeClass: "text-[#ba1a1a] bg-[rgba(186,26,26,0.08)] border-[rgba(186,26,26,0.2)]",
  },
];

function UserAvatar({
  user,
  size = "sm",
}: {
  user: Pick<UserSummaryResponse, "fullName" | "email" | "avatarUrl">;
  size?: "xs" | "sm" | "md";
}) {
  const sizeClass = {
    xs: "h-5 w-5 text-[10px]",
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
  }[size];
  const initial = (user.fullName ?? user.email).charAt(0).toUpperCase();

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName ?? user.email}
        className={cn(sizeClass, "rounded-full object-cover shrink-0")}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-full bg-[rgba(35,58,135,0.08)] text-[#233a87] font-semibold flex items-center justify-center shrink-0",
      )}
    >
      {initial}
    </div>
  );
}

export function TaskDetailPage() {
  const {
    id: workspaceIdStr,
    projectId: projectIdStr,
    taskId: taskIdStr,
  } = useParams<{ id: string; projectId: string; taskId: string }>();
  const workspaceId = Number(workspaceIdStr);
  const projectId = Number(projectIdStr);
  const taskId = Number(taskIdStr);
  const navigate = useNavigate();

  const {
    data: taskData,
    isLoading,
    isError,
  } = useGetTaskByIdQuery(
    { projectId, taskId },
    { skip: isNaN(projectId) || isNaN(taskId) },
  );
  const task = taskData?.data ?? null;

  const [subtasksExpanded, setSubtasksExpanded] = useState(true);
  const { data: subtasksData } = useGetSubTasksQuery(
    { projectId, taskId, page: 0, size: 50 },
    { skip: isNaN(projectId) || isNaN(taskId) },
  );
  const subtasks = subtasksData?.data?.data ?? [];

  const { data: membersData } = useGetMembersQuery(
    { projectId, page: 0, size: 100 },
    { skip: isNaN(projectId) },
  );
  const members = membersData?.data?.data ?? [];

  const currentUserId = useAppSelector((state) => state.user.currentUser?.id);
  const { data: roleData } = useGetCurrentUserRoleQuery(projectId, {
    skip: isNaN(projectId),
  });

  const { data: workspaceData } = useGetWorkspaceByIdQuery(workspaceId, {
    skip: isNaN(workspaceId),
  });
  const { data: projectData } = useGetProjectByIdQuery(
    { workspaceId, projectId },
    { skip: isNaN(workspaceId) || isNaN(projectId) },
  );
  const workspaceName = workspaceData?.data?.name ?? "Workspace";
  const projectName = projectData?.data?.name ?? "Project";

  const parentTaskId = task?.parentTaskId ?? null;
  const { data: parentTaskData } = useGetTaskByIdQuery(
    { projectId, taskId: parentTaskId ?? 0 },
    { skip: parentTaskId == null },
  );
  const parentTask = parentTaskData?.data ?? null;

  const [updateTask] = useUpdateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [createTask] = useCreateTaskMutation();
  const { reportAction } = useGuidance();

  const { data: sprintsData } = useGetProjectSprintsQuery(
    { projectId, page: 0, size: 100 },
    { skip: isNaN(projectId) },
  );
  const sprints = sprintsData?.data?.data ?? [];

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  const [editingStartDate, setEditingStartDate] = useState(false);
  const [editingDueDate, setEditingDueDate] = useState(false);

  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskSheetOpen, setSubtaskSheetOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function saveTitle() {
    if (!task || !titleDraft.trim() || titleDraft.trim() === task.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateTask({ projectId, taskId, title: titleDraft.trim() }).unwrap();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update title"));
    }
    setEditingTitle(false);
  }

  async function saveDescription() {
    if (!task) return;
    const next = descDraft.trim() || undefined;
    if (next === (task.description ?? undefined)) {
      setEditingDesc(false);
      return;
    }
    try {
      await updateTask({ projectId, taskId, description: next }).unwrap();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update description"));
    }
    setEditingDesc(false);
  }

  function saveStatus(status: TaskStatus) {
    updateTaskStatus({ projectId, taskId, status })
      .unwrap()
      .then(() => {
        reportAction("TASK_STATUS_UPDATED");
      })
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to update status")));
  }

  function savePriority(priority: TaskPriority) {
    updateTask({ projectId, taskId, priority })
      .unwrap()
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to update priority")));
  }

  async function saveStartDate(value: string) {
    try {
      await updateTask({
        projectId,
        taskId,
        startDate: value ? new Date(value).toISOString() : undefined,
      }).unwrap();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update start date"));
    }
    setEditingStartDate(false);
  }

  async function saveDueDate(value: string) {
    try {
      await updateTask({
        projectId,
        taskId,
        dueDate: value ? new Date(value).toISOString() : undefined,
      }).unwrap();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update due date"));
    }
    setEditingDueDate(false);
  }

  function addAssignee(userId: number) {
    if (!task) return;
    const ids = [...task.assignees.map((a) => a.id), userId];
    updateTask({ projectId, taskId, assigneeIds: ids })
      .unwrap()
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to assign member")));
    setShowAssigneeMenu(false);
  }

  function removeAssignee(userId: number) {
    if (!task) return;
    const ids = task.assignees.map((a) => a.id).filter((id) => id !== userId);
    updateTask({ projectId, taskId, assigneeIds: ids })
      .unwrap()
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to remove assignee")));
  }

  function saveSprint(value: string) {
    if (value === "NONE") {
      updateTask({ projectId, taskId, removeSprint: true })
        .unwrap()
        .catch((err) => toast.error(getApiErrorMessage(err, "Failed to remove sprint")));
    } else {
      updateTask({ projectId, taskId, sprintId: Number(value) })
        .unwrap()
        .catch((err) => toast.error(getApiErrorMessage(err, "Failed to update sprint")));
    }
  }

  async function addSubtask() {
    if (!newSubtaskTitle.trim()) return;
    try {
      await createTask({
        projectId,
        title: newSubtaskTitle.trim(),
        parentTaskId: taskId,
      }).unwrap();
      setNewSubtaskTitle("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add subtask"));
    }
  }

  function toggleSubtaskDone(subtaskId: number, currentStatus: TaskStatus) {
    const status: TaskStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    updateTaskStatus({ projectId, taskId: subtaskId, status, _parentTaskId: taskId })
      .unwrap()
      .catch((err) => toast.error(getApiErrorMessage(err, "Failed to update subtask")));
  }

  async function handleDelete() {
    if (!task) return;
    const taskTitle = task.title;
    try {
      await deleteTask({ projectId, taskId }).unwrap();
      setShowDeleteDialog(false);
      navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
      const toastId = toast.success(`"${taskTitle}" deleted`, {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            toast.dismiss(toastId);
            toast.info("Undo is not yet available");
          },
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete task"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#444651]" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="text-sm text-[#444651]">Task not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Board
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_OPTIONS.find((s) => s.value === task.status)!;
  const priorityCfg = PRIORITY_OPTIONS.find((p) => p.value === task.priority) ?? null;
  const doneSubs = subtasks.filter((s) => s.status === "DONE").length;
  const unassigned = members.filter(
    (m) => !task.assignees.some((a) => a.id === m.user.id),
  );

  const currentUserMember = members.find((m) => m.user.id === currentUserId);
  const canCreateTask =
    currentUserMember?.permissions?.includes("CREATE_TASK") ??
    (roleData?.data !== undefined && roleData.data !== "VIEWER");
  const canEdit = task.permissions?.includes("EDIT") ?? true;
  const canDelete = task.permissions?.includes("DELETE") ?? true;
  const canUpdateStatus = task.permissions?.includes("UPDATE_STATUS") ?? true;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-xs text-[#444651] flex-wrap">
        <Link to="/workspaces" className="hover:text-[#1a1c1b] transition-colors">
          Workspaces
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/workspaces/${workspaceId}`}
          className="hover:text-[#1a1c1b] transition-colors"
        >
          {workspaceName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/workspaces/${workspaceId}/projects/${projectId}`}
          className="hover:text-[#1a1c1b] transition-colors"
        >
          {projectName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/workspaces/${workspaceId}/projects/${projectId}/tasks`}
          className="hover:text-[#1a1c1b] transition-colors"
        >
          Tasks
        </Link>
        <ChevronRight className="h-3 w-3" />
        {parentTask && (
          <>
            <Link
              to={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${parentTask.id}`}
              className="max-w-[150px] truncate hover:text-[#1a1c1b] transition-colors"
            >
              {parentTask.title}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="max-w-[200px] truncate font-medium text-[#1a1c1b]">
          {task.title}
        </span>
      </nav>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks`)
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Board
        </Button>

        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-[#ba1a1a] focus:text-[#ba1a1a]"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card className="p-5">
            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                className="w-full rounded-md border border-input bg-white px-3 py-1.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : canEdit ? (
              <button
                onClick={() => {
                  setTitleDraft(task.title);
                  setEditingTitle(true);
                }}
                className="-mx-2 w-full rounded-md px-2 py-1 text-left text-xl font-bold transition-colors hover:bg-[rgba(68,70,81,0.05)]"
              >
                {task.title}
              </button>
            ) : (
              <p className="-mx-2 w-full px-2 py-1 text-xl font-bold">{task.title}</p>
            )}

            {task.parentTaskId && (
              <p className="mt-2 text-xs text-[#444651]">
                Subtask of{" "}
                <Link
                  to={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.parentTaskId}`}
                  className="text-[#233a87] hover:underline"
                >
                  {parentTask?.title ?? `Task #${task.parentTaskId}`}
                </Link>
              </p>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#444651]">
              Description
            </p>
            {editingDesc ? (
              <textarea
                autoFocus
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={saveDescription}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingDesc(false);
                }}
                rows={5}
                placeholder="Add a description..."
                className="w-full resize-none rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : canEdit ? (
              <button
                onClick={() => {
                  setDescDraft(task.description ?? "");
                  setEditingDesc(true);
                }}
                className="-mx-2 min-h-[80px] w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[rgba(68,70,81,0.05)]"
              >
                {task.description ? (
                  <span className="whitespace-pre-wrap text-[#1a1c1b]">
                    {task.description}
                  </span>
                ) : (
                  <span className="italic text-[#444651]">
                    Click to add description...
                  </span>
                )}
              </button>
            ) : (
              <div className="-mx-2 min-h-[80px] px-2 py-1.5 text-sm">
                {task.description ? (
                  <span className="whitespace-pre-wrap text-[#1a1c1b]">
                    {task.description}
                  </span>
                ) : (
                  <span className="italic text-[#444651]">No description.</span>
                )}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <button
              onClick={() => setSubtasksExpanded((v) => !v)}
              className="flex w-full items-center gap-2 text-left"
            >
              {subtasksExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-[#444651]" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-[#444651]" />
              )}
              <span className="text-sm font-medium">Subtasks</span>
              <span className="rounded-full bg-[#efeeec] px-2 py-0.5 text-xs text-[#444651]">
                {doneSubs}/{subtasks.length}
              </span>
              {subtasks.length > 0 && (
                <div className="ml-2 h-1.5 flex-1 overflow-hidden rounded-full bg-[#efeeec]">
                  <div
                    className="h-full rounded-full bg-[#006a61] transition-all"
                    style={{
                      width: `${Math.round((doneSubs / subtasks.length) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </button>

            {subtasksExpanded && (
              <div className="mt-3 space-y-0.5">
                {subtasks.map((st) => {
                  const canToggleSubtask = st.permissions?.includes("UPDATE_STATUS") ?? true;
                  return (
                    <div
                      key={st.id}
                      className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[rgba(68,70,81,0.04)]"
                    >
                      <button
                        onClick={() => toggleSubtaskDone(st.id, st.status)}
                        disabled={!canToggleSubtask}
                        className={cn(
                          "shrink-0 text-[#444651] transition-colors hover:text-[#006a61]",
                          !canToggleSubtask && "opacity-40 cursor-not-allowed",
                        )}
                      >
                        {st.status === "DONE" ? (
                          <CheckCircle2 className="h-4 w-4 text-[#006a61]" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                      <span
                        onClick={() =>
                          navigate(
                            `/workspaces/${workspaceId}/projects/${projectId}/tasks/${st.id}`,
                          )
                        }
                        className={cn(
                          "flex-1 cursor-pointer text-sm hover:text-[#233a87] hover:underline",
                          st.status === "DONE" && "line-through text-[#444651]",
                        )}
                      >
                        {st.title}
                      </span>
                      {st.assignees.length > 0 && (
                        <div className="flex -space-x-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                          {st.assignees.slice(0, 3).map((a) => (
                            <UserAvatar key={a.id} user={a} size="xs" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {canCreateTask && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 shrink-0 text-[#444651]" />
                      <input
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSubtaskTitle.trim()) addSubtask();
                        }}
                        placeholder="Quick add (Enter to save)..."
                        className="flex-1 rounded-md border-0 bg-transparent px-2 py-1 text-sm placeholder:text-[#444651] focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {newSubtaskTitle.trim() && (
                        <Button size="sm" className="h-6 text-xs" onClick={addSubtask}>
                          Add
                        </Button>
                      )}
                    </div>
                    <button
                      onClick={() => setSubtaskSheetOpen(true)}
                      className="ml-6 flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <SquarePen className="h-3 w-3" />
                      Add with more details
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          <AttachmentSection taskId={taskId} />
        </div>

        <div className="space-y-4 md:sticky md:top-20 self-start">
          <Card className="p-4 space-y-4 bg-white/90 backdrop-blur-sm border-[rgba(197,197,211,0.3)]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#444651]">
                  Status
                </p>
                <GuidanceTarget capability="UPDATE_TASK_STATUS">
                  <Select
                    value={task.status}
                    onValueChange={(v) => saveStatus(v as TaskStatus)}
                    disabled={!canUpdateStatus}
                  >
                    <SelectTrigger className={cn("border font-medium", statusCfg.badgeClass)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </GuidanceTarget>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#444651]">
                  Priority
                </p>
                <Select
                  value={task.priority ?? "none"}
                  onValueChange={(v) => {
                    if (v !== "none") savePriority(v as TaskPriority);
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    className={cn(
                      "border font-medium",
                      priorityCfg ? priorityCfg.badgeClass : "text-[#444651]",
                    )}
                  >
                    <SelectValue placeholder="No priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No priority</SelectItem>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-[#efeeec]" />

            <TaskTagSelector
              projectId={projectId}
              task={task}
              disabled={!canEdit}
              onOpenBoardByTag={(tagId) =>
                navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks?tags=${tagId}`)
              }
            />
          </Card>

          <Card className="p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#444651]">
              Schedule
            </p>
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-xs text-[#444651]">Start Date</p>
                {editingStartDate ? (
                  <input
                    autoFocus
                    type="datetime-local"
                    defaultValue={task.startDate ? toDatetimeLocal(task.startDate) : ""}
                    onBlur={(e) => saveStartDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingStartDate(false);
                    }}
                    className="w-full rounded-md border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : canEdit ? (
                  <button
                    onClick={() => setEditingStartDate(true)}
                    className="w-full rounded-md border bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-[rgba(68,70,81,0.05)]"
                  >
                    {task.startDate ? (
                      format(new Date(task.startDate), "MMM d, yyyy · HH:mm")
                    ) : (
                      <span className="italic text-[#444651]">Not set</span>
                    )}
                  </button>
                ) : (
                  <div className="w-full rounded-md border bg-white px-3 py-2 text-sm">
                    {task.startDate ? (
                      format(new Date(task.startDate), "MMM d, yyyy · HH:mm")
                    ) : (
                      <span className="italic text-[#444651]">Not set</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#444651]">Due Date</p>
                {editingDueDate ? (
                  <input
                    autoFocus
                    type="datetime-local"
                    defaultValue={task.dueDate ? toDatetimeLocal(task.dueDate) : ""}
                    onBlur={(e) => saveDueDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingDueDate(false);
                    }}
                    className="w-full rounded-md border border-input bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : canEdit ? (
                  <button
                    onClick={() => setEditingDueDate(true)}
                    className="w-full rounded-md border bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-[rgba(68,70,81,0.05)]"
                  >
                    {task.dueDate ? (
                      <span
                        className={cn(
                          new Date(task.dueDate) < new Date() && task.status !== "DONE"
                            ? "font-medium text-[#ba1a1a]"
                            : "",
                        )}
                      >
                        {format(new Date(task.dueDate), "MMM d, yyyy · HH:mm")}
                      </span>
                    ) : (
                      <span className="italic text-[#444651]">Not set</span>
                    )}
                  </button>
                ) : (
                  <div className="w-full rounded-md border bg-white px-3 py-2 text-sm">
                    {task.dueDate ? (
                      <span
                        className={cn(
                          new Date(task.dueDate) < new Date() && task.status !== "DONE"
                            ? "font-medium text-[#ba1a1a]"
                            : "",
                        )}
                      >
                        {format(new Date(task.dueDate), "MMM d, yyyy · HH:mm")}
                      </span>
                    ) : (
                      <span className="italic text-[#444651]">Not set</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Sprint */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#444651]" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#444651]">
                Sprint
              </p>
            </div>
            <Select
              value={task.sprintId != null ? String(task.sprintId) : "NONE"}
              onValueChange={saveSprint}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder="No Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">
                  <span className="text-[#444651] italic">No Sprint</span>
                </SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={String(sprint.id)}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#444651]">
                Assignees
              </p>
              <span className="text-xs text-[#444651]">{task.assignees.length}</span>
            </div>

            <div className="space-y-1.5">
              {task.assignees.map((a) => (
                <div
                  key={a.id}
                  className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-[rgba(68,70,81,0.04)]"
                >
                  <UserAvatar user={a} size="sm" />
                  <span className="flex-1 truncate text-sm">{a.fullName ?? a.email}</span>
                  {canEdit && (
                    <button
                      onClick={() => removeAssignee(a.id)}
                      className="invisible text-[#444651] transition-colors hover:text-[#ba1a1a] group-hover:visible"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canEdit && (
              <DropdownMenu open={showAssigneeMenu} onOpenChange={setShowAssigneeMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-full text-xs">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Assign member
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-48 w-56 overflow-y-auto">
                  {unassigned.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-[#444651]">
                      All members assigned
                    </p>
                  ) : (
                    unassigned.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        className="gap-2"
                        onClick={() => addAssignee(m.user.id)}
                      >
                        <UserAvatar user={m.user} size="xs" />
                        <span className="truncate text-sm">{m.user.fullName ?? m.user.email}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </Card>

          <Card className="p-4 space-y-2 text-xs text-[#444651]">
            <div className="flex items-center gap-2">
              <UserAvatar user={task.createdBy} size="xs" />
              <span>
                Created by{" "}
                <span className="font-medium text-[#1a1c1b]">
                  {task.createdBy.fullName ?? task.createdBy.email}
                </span>
              </span>
            </div>
            <p>Created {format(new Date(task.createdAt), "MMM d, yyyy")}</p>
            <p>Updated {format(new Date(task.updatedAt), "MMM d, yyyy · HH:mm")}</p>
          </Card>
        </div>
      </div>

      <CommentSection taskId={taskId} projectId={projectId} />

      <TaskFormSheet
        open={subtaskSheetOpen}
        onOpenChange={setSubtaskSheetOpen}
        projectId={projectId}
        parentTaskId={taskId}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{task.title}&rdquo;</strong>? All subtasks will also
              be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
