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
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
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
import { useGetWorkspaceByIdQuery } from "@/features/workspace/api/workspaceApi";
import { useGetProjectByIdQuery } from "@/features/project/api/projectApi";

// ─── Config ──────────────────────────────────────────────────────────────────────
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; badgeClass: string }[] = [
  { value: "TODO", label: "Todo", badgeClass: "text-slate-600 bg-slate-100 border-slate-200" },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    badgeClass: "text-blue-600 bg-blue-50 border-blue-200",
  },
  { value: "REVIEW", label: "Review", badgeClass: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "DONE", label: "Done", badgeClass: "text-green-600 bg-green-50 border-green-200" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; badgeClass: string }[] = [
  { value: "LOW", label: "Low", badgeClass: "text-slate-600 bg-slate-100 border-slate-200" },
  { value: "MEDIUM", label: "Medium", badgeClass: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "HIGH", label: "High", badgeClass: "text-amber-600 bg-amber-50 border-amber-200" },
  {
    value: "URGENT",
    label: "Urgent",
    badgeClass: "text-red-600 bg-red-50 border-red-200",
  },
];

// ─── User Avatar helper ──────────────────────────────────────────────────────────
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
        "rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0",
      )}
    >
      {initial}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────
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

  // ─── Queries ─────────────────────────────────────────────────────────────────
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
    { projectId, taskId },
    { skip: isNaN(projectId) || isNaN(taskId) },
  );
  const subtasks = subtasksData?.data ?? [];

  const { data: membersData } = useGetMembersQuery(projectId, { skip: isNaN(projectId) });
  const members = membersData?.data ?? [];

  const { data: workspaceData } = useGetWorkspaceByIdQuery(workspaceId, {
    skip: isNaN(workspaceId),
  });
  const { data: projectData } = useGetProjectByIdQuery(
    { workspaceId, projectId },
    { skip: isNaN(workspaceId) || isNaN(projectId) },
  );
  const workspaceName = workspaceData?.data?.name ?? "Workspace";
  const projectName = projectData?.data?.name ?? "Project";

  // Fetch parent task when this is a subtask
  const parentTaskId = task?.parentTaskId ?? null;
  const { data: parentTaskData } = useGetTaskByIdQuery(
    { projectId, taskId: parentTaskId ?? 0 },
    { skip: parentTaskId == null },
  );
  const parentTask = parentTaskData?.data ?? null;

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const [updateTask] = useUpdateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [createTask] = useCreateTaskMutation();

  // ─── Inline edit states ──────────────────────────────────────────────────────
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

  // ─── Save handlers ───────────────────────────────────────────────────────────
  async function saveTitle() {
    if (!task || !titleDraft.trim() || titleDraft.trim() === task.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateTask({ projectId, taskId, title: titleDraft.trim() }).unwrap();
    } catch {
      toast.error("Failed to update title");
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
    } catch {
      toast.error("Failed to update description");
    }
    setEditingDesc(false);
  }

  function saveStatus(status: TaskStatus) {
    updateTaskStatus({ projectId, taskId, status })
      .unwrap()
      .catch(() => toast.error("Failed to update status"));
  }

  function savePriority(priority: TaskPriority) {
    updateTask({ projectId, taskId, priority })
      .unwrap()
      .catch(() => toast.error("Failed to update priority"));
  }

  async function saveStartDate(value: string) {
    try {
      await updateTask({ projectId, taskId, startDate: value ? new Date(value).toISOString() : undefined }).unwrap();
    } catch {
      toast.error("Failed to update start date");
    }
    setEditingStartDate(false);
  }

  async function saveDueDate(value: string) {
    try {
      await updateTask({ projectId, taskId, dueDate: value ? new Date(value).toISOString() : undefined }).unwrap();
    } catch {
      toast.error("Failed to update due date");
    }
    setEditingDueDate(false);
  }

  function addAssignee(userId: number) {
    if (!task) return;
    const ids = [...task.assignees.map((a) => a.id), userId];
    updateTask({ projectId, taskId, assigneeIds: ids })
      .unwrap()
      .catch(() => toast.error("Failed to assign member"));
    setShowAssigneeMenu(false);
  }

  function removeAssignee(userId: number) {
    if (!task) return;
    const ids = task.assignees.map((a) => a.id).filter((id) => id !== userId);
    updateTask({ projectId, taskId, assigneeIds: ids })
      .unwrap()
      .catch(() => toast.error("Failed to remove assignee"));
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
    } catch {
      toast.error("Failed to add subtask");
    }
  }

  function toggleSubtaskDone(subtaskId: number, currentStatus: TaskStatus) {
    const status: TaskStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    updateTaskStatus({ projectId, taskId: subtaskId, status, _parentTaskId: taskId })
      .unwrap()
      .catch(() => toast.error("Failed to update subtask"));
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
    } catch {
      toast.error("Failed to delete task");
    }
  }

  // ─── Loading / Error ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Task not found.</p>
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
        <Link
          to={`/workspaces/${workspaceId}/projects/${projectId}`}
          className="hover:text-foreground transition-colors"
        >
          {projectName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/workspaces/${workspaceId}/projects/${projectId}/tasks`}
          className="hover:text-foreground transition-colors"
        >
          Tasks
        </Link>
        <ChevronRight className="h-3 w-3" />
        {parentTask && (
          <>
            <Link
              to={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${parentTask.id}`}
              className="max-w-[150px] truncate hover:text-foreground transition-colors"
            >
              {parentTask.title}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="max-w-[200px] truncate font-medium text-foreground">
          {task.title}
        </span>
      </nav>

      {/* ── Header ── */}
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Main 2-column grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* ───── Left column ───── */}
        <div className="space-y-4">
          {/* Title */}
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
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <button
                onClick={() => {
                  setTitleDraft(task.title);
                  setEditingTitle(true);
                }}
                className="-mx-2 w-full rounded-md px-2 py-1 text-left text-xl font-bold transition-colors hover:bg-muted/50"
              >
                {task.title}
              </button>
            )}

            {task.parentTaskId && (
              <p className="mt-2 text-xs text-muted-foreground">
                Subtask of{" "}
                <Link
                  to={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.parentTaskId}`}
                  className="text-primary hover:underline"
                >
                  {parentTask?.title ?? `Task #${task.parentTaskId}`}
                </Link>
              </p>
            )}
          </Card>

          {/* Description */}
          <Card className="p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <button
                onClick={() => {
                  setDescDraft(task.description ?? "");
                  setEditingDesc(true);
                }}
                className="-mx-2 min-h-[80px] w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
              >
                {task.description ? (
                  <span className="whitespace-pre-wrap text-foreground">
                    {task.description}
                  </span>
                ) : (
                  <span className="italic text-muted-foreground">
                    Click to add description...
                  </span>
                )}
              </button>
            )}
          </Card>

          {/* Subtasks */}
          <Card className="p-5">
            {/* Section header */}
            <button
              onClick={() => setSubtasksExpanded((v) => !v)}
              className="flex w-full items-center gap-2 text-left"
            >
              {subtasksExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Subtasks</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {doneSubs}/{subtasks.length}
              </span>
              {subtasks.length > 0 && (
                <div className="ml-2 h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{
                      width: `${Math.round((doneSubs / subtasks.length) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </button>

            {subtasksExpanded && (
              <div className="mt-3 space-y-0.5">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"
                  >
                    <button
                      onClick={() => toggleSubtaskDone(st.id, st.status)}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-green-600"
                    >
                      {st.status === "DONE" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
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
                        "flex-1 cursor-pointer text-sm hover:text-primary hover:underline",
                        st.status === "DONE" && "line-through text-muted-foreground",
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
                ))}

                {/* Add subtask */}
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSubtaskTitle.trim()) addSubtask();
                      }}
                      placeholder="Quick add (Enter to save)..."
                      className="flex-1 rounded-md border-0 bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
              </div>
            )}
          </Card>
        </div>

        {/* ───── Right sidebar ───── */}
        <div className="space-y-4">
          <Card className="p-5 space-y-5">
            {/* Status */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <Select
                value={task.status}
                onValueChange={(v) => saveStatus(v as TaskStatus)}
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
            </div>

            <Separator />

            {/* Priority */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Priority
              </p>
              <Select
                value={task.priority ?? "none"}
                onValueChange={(v) => {
                  if (v !== "none") savePriority(v as TaskPriority);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "border font-medium",
                    priorityCfg ? priorityCfg.badgeClass : "text-muted-foreground",
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

            <Separator />

            {/* Dates */}
            <div className="space-y-3">
              {/* Start date */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Start Date
                </p>
                {editingStartDate ? (
                  <input
                    autoFocus
                    type="datetime-local"
                    defaultValue={task.startDate ? toDatetimeLocal(task.startDate) : ""}
                    onBlur={(e) => saveStartDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingStartDate(false);
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <button
                    onClick={() => setEditingStartDate(true)}
                    className="-mx-2 w-full rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    {task.startDate ? (
                      format(new Date(task.startDate), "MMM d, yyyy · HH:mm")
                    ) : (
                      <span className="italic text-muted-foreground">Not set</span>
                    )}
                  </button>
                )}
              </div>

              {/* Due date */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Due Date
                </p>
                {editingDueDate ? (
                  <input
                    autoFocus
                    type="datetime-local"
                    defaultValue={task.dueDate ? toDatetimeLocal(task.dueDate) : ""}
                    onBlur={(e) => saveDueDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingDueDate(false);
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <button
                    onClick={() => setEditingDueDate(true)}
                    className="-mx-2 w-full rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    {task.dueDate ? (
                      <span
                        className={cn(
                          new Date(task.dueDate) < new Date() && task.status !== "DONE"
                            ? "font-medium text-destructive"
                            : "",
                        )}
                      >
                        {format(new Date(task.dueDate), "MMM d, yyyy · HH:mm")}
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground">Not set</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <Separator />

            {/* Assignees */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Assignees
              </p>

              <div className="space-y-1.5">
                {task.assignees.map((a) => (
                  <div key={a.id} className="group flex items-center gap-2">
                    <UserAvatar user={a} size="sm" />
                    <span className="flex-1 truncate text-sm">
                      {a.fullName ?? a.email}
                    </span>
                    <button
                      onClick={() => removeAssignee(a.id)}
                      className="invisible text-muted-foreground transition-colors hover:text-destructive group-hover:visible"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <DropdownMenu open={showAssigneeMenu} onOpenChange={setShowAssigneeMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-full text-xs">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Assign member
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-48 w-56 overflow-y-auto">
                  {unassigned.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
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
                        <span className="truncate text-sm">
                          {m.user.fullName ?? m.user.email}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator />

            {/* Meta */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserAvatar user={task.createdBy} size="xs" />
                <span>
                  Created by{" "}
                  <span className="font-medium text-foreground">
                    {task.createdBy.fullName ?? task.createdBy.email}
                  </span>
                </span>
              </div>
              <p>Created {format(new Date(task.createdAt), "MMM d, yyyy")}</p>
              <p>Updated {format(new Date(task.updatedAt), "MMM d, yyyy · HH:mm")}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Subtask full-form sheet ── */}
      <TaskFormSheet
        open={subtaskSheetOpen}
        onOpenChange={setSubtaskSheetOpen}
        projectId={projectId}
        parentTaskId={taskId}
      />

      {/* ── Delete Dialog ── */}
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
