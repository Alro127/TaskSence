import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskResponse, TaskStatus } from "@/types/api";

import { useGetTasksByProjectQuery, useDeleteTaskMutation, useUpdateTaskMutation } from "../api/taskApi";
import { TaskFormSheet } from "../components/TaskFormSheet";

// ─── Config ──────────────────────────────────────────────────────────────────────
const STATUS_COLUMNS: {
  value: TaskStatus;
  label: string;
  badgeClass: string;
  headerClass: string;
}[] = [
  {
    value: "TODO",
    label: "Todo",
    badgeClass: "text-slate-600 bg-slate-100 border-slate-200",
    headerClass: "border-t-slate-400",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    badgeClass: "text-blue-600 bg-blue-50 border-blue-200",
    headerClass: "border-t-blue-500",
  },
  {
    value: "REVIEW",
    label: "Review",
    badgeClass: "text-amber-600 bg-amber-50 border-amber-200",
    headerClass: "border-t-amber-500",
  },
  {
    value: "DONE",
    label: "Done",
    badgeClass: "text-green-600 bg-green-50 border-green-200",
    headerClass: "border-t-green-500",
  },
];

const PRIORITY_BADGE: Record<TaskPriority, { label: string; class: string }> = {
  LOW: { label: "Low", class: "text-slate-500 bg-slate-100 border-slate-200" },
  MEDIUM: { label: "Medium", class: "text-blue-600 bg-blue-50 border-blue-200" },
  HIGH: { label: "High", class: "text-amber-600 bg-amber-50 border-amber-200" },
  URGENT: { label: "Urgent", class: "text-red-600 bg-red-50 border-red-200" },
};

// ─── Task Card (draggable, used in Kanban board) ─────────────────────────────────
function TaskCard({
  task,
  projectId,
  workspaceId,
  onEdit,
  onDelete,
  isDragOverlay = false,
}: {
  task: TaskResponse;
  projectId: number;
  workspaceId: number;
  onEdit: (task: TaskResponse) => void;
  onDelete: (task: TaskResponse) => void;
  isDragOverlay?: boolean;
}) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        isDragOverlay
          ? "rotate-1 shadow-lg opacity-95 cursor-grabbing"
          : "hover:shadow-md",
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-40 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* 3-dot menu */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(task)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <button
        onClick={() =>
          navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`)
        }
        className="block w-full pl-4 pr-6 text-left text-sm font-medium hover:text-primary hover:underline"
      >
        {task.title}
      </button>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-4">
        {task.priority && (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
              PRIORITY_BADGE[task.priority].class,
            )}
          >
            {PRIORITY_BADGE[task.priority].label}
          </span>
        )}
        {task.dueDate && (
          <span
            className={cn(
              "text-[10px]",
              isOverdue ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Assignees */}
      {task.assignees.length > 0 && (
        <div className="mt-2 flex -space-x-1 pl-4">
          {task.assignees.slice(0, 4).map((a) =>
            a.avatarUrl ? (
              <img
                key={a.id}
                src={a.avatarUrl}
                alt={a.fullName ?? a.email}
                className="h-5 w-5 rounded-full border-2 border-card object-cover"
              />
            ) : (
              <div
                key={a.id}
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[8px] font-bold text-primary"
              >
                {(a.fullName ?? a.email).charAt(0).toUpperCase()}
              </div>
            ),
          )}
          {task.assignees.length > 4 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-muted text-[8px] text-muted-foreground">
              +{task.assignees.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Droppable Kanban Column ──────────────────────────────────────────────────────
function KanbanColumn({
  col,
  tasks,
  projectId,
  workspaceId,
  onEdit,
  onDelete,
  onAddTask,
  isOver,
}: {
  col: (typeof STATUS_COLUMNS)[number];
  tasks: TaskResponse[];
  projectId: number;
  workspaceId: number;
  onEdit: (task: TaskResponse) => void;
  onDelete: (task: TaskResponse) => void;
  onAddTask: () => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: col.value });

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-t-4 transition-colors",
        col.headerClass,
        isOver ? "bg-muted/50" : "bg-muted/20",
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
            col.badgeClass,
          )}
        >
          {col.label}
        </span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      {/* Drop zone + task cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3 min-h-[120px] rounded-md transition-colors",
          isOver && "ring-2 ring-primary/30 ring-inset",
        )}
      >
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            projectId={projectId}
            workspaceId={workspaceId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {tasks.length === 0 && !isOver && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-8">
            <p className="text-xs text-muted-foreground">Drop tasks here</p>
          </div>
        )}

        {tasks.length === 0 && isOver && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 py-8">
            <p className="text-xs font-medium text-primary">Release to move here</p>
          </div>
        )}
      </div>

      {/* Quick add button per column */}
      <button
        onClick={onAddTask}
        className="flex items-center gap-2 border-t px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    </div>
  );
}

// ─── List Row ────────────────────────────────────────────────────────────────────
function TaskListRow({
  task,
  projectId,
  workspaceId,
  onEdit,
  onDelete,
}: {
  task: TaskResponse;
  projectId: number;
  workspaceId: number;
  onEdit: (task: TaskResponse) => void;
  onDelete: (task: TaskResponse) => void;
}) {
  const navigate = useNavigate();
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div className="group flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted/40">
      {/* Title */}
      <button
        onClick={() =>
          navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`)
        }
        className="flex-1 truncate text-left text-sm font-medium hover:text-primary hover:underline"
      >
        {task.title}
      </button>

      {/* Priority */}
      <div className="hidden w-20 shrink-0 sm:block">
        {task.priority ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              PRIORITY_BADGE[task.priority].class,
            )}
          >
            {PRIORITY_BADGE[task.priority].label}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Due date */}
      <div className="hidden w-24 shrink-0 text-xs md:block">
        {task.dueDate ? (
          <span className={cn(isOverdue ? "font-medium text-destructive" : "text-muted-foreground")}>
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* Assignees */}
      <div className="hidden shrink-0 sm:flex -space-x-1">
        {task.assignees.slice(0, 3).map((a) =>
          a.avatarUrl ? (
            <img
              key={a.id}
              src={a.avatarUrl}
              alt={a.fullName ?? a.email}
              className="h-5 w-5 rounded-full border-2 border-background object-cover"
            />
          ) : (
            <div
              key={a.id}
              className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[8px] font-bold text-primary"
            >
              {(a.fullName ?? a.email).charAt(0).toUpperCase()}
            </div>
          ),
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(task)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────
export function TaskBoardPage() {
  const {
    id: workspaceIdStr,
    projectId: projectIdStr,
  } = useParams<{ id: string; projectId: string }>();
  const workspaceId = Number(workspaceIdStr);
  const projectId = Number(projectIdStr);

  // ─── Data ───────────────────────────────────────────────────────────────────
  const { data: tasksData, isLoading } = useGetTasksByProjectQuery(projectId, {
    skip: isNaN(projectId),
  });
  const tasks = tasksData?.data ?? [];

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  // ─── UI state ───────────────────────────────────────────────────────────────
  type ViewMode = "list" | "board";
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");
  const [keyword, setKeyword] = useState("");

  const [collapsedGroups, setCollapsedGroups] = useState<Set<TaskStatus>>(new Set());

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | undefined>();

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<TaskResponse | null>(null);

  // Drag state
  const [activeTask, setActiveTask] = useState<TaskResponse | null>(null);
  const [overColumnId, setOverColumnId] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // ─── Filtered tasks ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
      if (keyword.trim()) {
        const q = keyword.toLowerCase();
        if (!t.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tasks, filterStatus, keyword]);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskResponse[]>();
    STATUS_COLUMNS.forEach((col) => map.set(col.value, []));
    filtered.forEach((t) => {
      map.get(t.status)?.push(t);
    });
    return map;
  }, [filtered]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenCreate = useCallback(() => {
    setEditingTask(undefined);
    setSheetOpen(true);
  }, []);

  const handleOpenEdit = useCallback((task: TaskResponse) => {
    setEditingTask(task);
    setSheetOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((task: TaskResponse) => {
    setDeleteTarget(task);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const title = deleteTarget.title;
    try {
      await deleteTask({ projectId, taskId: deleteTarget.id }).unwrap();
      setDeleteTarget(null);
      const toastId = toast.success(`"${title}" deleted`, {
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
  };

  const toggleGroup = (status: TaskStatus) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  // ─── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as TaskResponse | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: { over: { id: unknown } | null }) => {
    const overId = event.over?.id;
    if (overId && STATUS_COLUMNS.some((c) => c.value === overId)) {
      setOverColumnId(overId as TaskStatus);
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setOverColumnId(null);
    const { active, over } = event;
    if (!over) return;
    const droppedOnColumn = STATUS_COLUMNS.find((c) => c.value === over.id);
    if (!droppedOnColumn) return;
    const task = active.data.current?.task as TaskResponse | undefined;
    if (!task) return;
    if (task.status === droppedOnColumn.value) return;
    try {
      await updateTask({
        projectId,
        taskId: task.id,
        status: droppedOnColumn.value,
      }).unwrap();
    } catch {
      toast.error("Failed to move task");
    }
  };

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
          Workspace
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to={`/workspaces/${workspaceId}/projects/${projectId}`}
          className="hover:text-foreground transition-colors"
        >
          Project
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">Tasks</span>
      </nav>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search tasks..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as TaskStatus | "ALL")}
        >
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_COLUMNS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex rounded-md border bg-muted p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2.5",
              viewMode === "list" && "bg-background shadow-sm",
            )}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2.5",
              viewMode === "board" && "bg-background shadow-sm",
            )}
            onClick={() => setViewMode("board")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>

        {/* New task */}
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && tasks.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="text-xs text-muted-foreground">
            Create the first task for this project.
          </p>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {!isLoading && tasks.length > 0 && viewMode === "list" && (
        <div className="space-y-4">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = grouped.get(col.value) ?? [];
            const isCollapsed = collapsedGroups.has(col.value);
            return (
              <Card key={col.value} className="overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(col.value)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      col.badgeClass,
                    )}
                  >
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {colTasks.length} task{colTasks.length !== 1 ? "s" : ""}
                  </span>
                </button>

                {/* Column header row */}
                {!isCollapsed && colTasks.length > 0 && (
                  <div className="hidden border-b px-4 py-1.5 sm:flex">
                    <span className="flex-1 text-xs font-medium text-muted-foreground">Title</span>
                    <span className="hidden w-20 shrink-0 text-xs font-medium text-muted-foreground sm:block">
                      Priority
                    </span>
                    <span className="hidden w-24 shrink-0 text-xs font-medium text-muted-foreground md:block">
                      Due
                    </span>
                    <span className="hidden w-16 shrink-0 text-xs font-medium text-muted-foreground sm:block">
                      Assignees
                    </span>
                    <span className="w-8 shrink-0" />
                  </div>
                )}

                {!isCollapsed && (
                  <div className="divide-y px-1 py-1">
                    {colTasks.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-center text-muted-foreground">
                        No tasks here
                      </p>
                    ) : (
                      colTasks.map((t) => (
                        <TaskListRow
                          key={t.id}
                          task={t}
                          projectId={projectId}
                          workspaceId={workspaceId}
                          onEdit={handleOpenEdit}
                          onDelete={handleDeleteRequest}
                        />
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── BOARD VIEW ── */}
      {!isLoading && tasks.length > 0 && viewMode === "board" && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid min-h-[400px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = grouped.get(col.value) ?? [];
              return (
                <KanbanColumn
                  key={col.value}
                  col={col}
                  tasks={colTasks}
                  projectId={projectId}
                  workspaceId={workspaceId}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteRequest}
                  onAddTask={handleOpenCreate}
                  isOver={overColumnId === col.value}
                />
              );
            })}
          </div>

          {/* Drag overlay — renders a floating ghost card while dragging */}
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                projectId={projectId}
                workspaceId={workspaceId}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteRequest}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── No results from filter ── */}
      {!isLoading && tasks.length > 0 && filtered.length === 0 && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-center">
          <p className="text-sm font-medium">No tasks match your filter</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterStatus("ALL");
              setKeyword("");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* ── Create/Edit Sheet ── */}
      <TaskFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        projectId={projectId}
        task={editingTask}
      />

      {/* ── Delete Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{deleteTarget?.title}&rdquo;</strong>? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
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
