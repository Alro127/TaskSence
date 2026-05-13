import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInDays,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronDown, ChevronRight, GanttChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Project, TaskPriority, TaskResponse, TaskStatus } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ZoomLevel = "hour" | "day" | "week" | "month";
type GroupBy = "none" | "status" | "assignee";

interface HeaderColumn {
  key: string;
  label: string;
  left: number;
  width: number;
  isToday?: boolean;
  isWeekend?: boolean;
}

interface GroupHeaderRow {
  type: "group";
  id: string;
  label: string;
  count: number;
  colorClass: string;
}

interface TaskRow {
  type: "task";
  task: TaskResponse;
}

type Row = GroupHeaderRow | TaskRow;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 44;
const GROUP_HEADER_HEIGHT = 36;
const HEADER_TOP_HEIGHT = 26;
const HEADER_BOTTOM_HEIGHT = 26;
const HEADER_HEIGHT = HEADER_TOP_HEIGHT + HEADER_BOTTOM_HEIGHT;
const LEFT_PANEL_WIDTH = 284;
const BAR_VERTICAL_PADDING = 7;
const MIN_BAR_WIDTH = 8;
const TIMELINE_SIDE_PADDING = 14; // extra days padding on each side

const PX_PER_DAY: Record<ZoomLevel, number> = {
  hour: 1152, // 48px × 24
  day: 40,
  week: 14,
  month: 3.5,
};

// ─── Status / Priority configs ────────────────────────────────────────────────

const STATUS_BAR: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  TODO: { bg: "bg-[rgba(68,70,81,0.10)]", border: "border-[rgba(68,70,81,0.25)]", text: "text-[#444651]" },
  IN_PROGRESS: { bg: "bg-[rgba(35,58,135,0.10)]", border: "border-[rgba(35,58,135,0.25)]", text: "text-[#233a87]" },
  REVIEW: { bg: "bg-[rgba(100,51,0,0.10)]", border: "border-[rgba(100,51,0,0.25)]", text: "text-[#643300]" },
  DONE: { bg: "bg-[rgba(0,106,97,0.10)]", border: "border-[rgba(0,106,97,0.25)]", text: "text-[#006a61]" },
};

const STATUS_GROUP_STYLE: Record<TaskStatus, { label: string; colorClass: string }> = {
  TODO: { label: "Todo", colorClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]" },
  IN_PROGRESS: { label: "In Progress", colorClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]" },
  REVIEW: { label: "Review", colorClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]" },
  DONE: { label: "Done", colorClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]" },
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW: "bg-[#444651]",
  MEDIUM: "bg-[#233a87]",
  HIGH: "bg-[#643300]",
  URGENT: "bg-[#ba1a1a]",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTaskEffectiveDates(task: TaskResponse, project: Project | null) {
  const fallbackStart = project?.startDate ? new Date(project.startDate) : new Date();
  const fallbackEnd = project?.endDate
    ? new Date(project.endDate)
    : addDays(fallbackStart, 7);

  const start = startOfDay(task.startDate ? new Date(task.startDate) : fallbackStart);
  const end = startOfDay(task.dueDate ? new Date(task.dueDate) : fallbackEnd);

  return { start, end: end >= start ? end : addDays(start, 1) };
}

interface GeneratedColumns {
  topColumns: HeaderColumn[];
  bottomColumns: HeaderColumn[];
}

function generateTimeColumns(
  zoom: ZoomLevel,
  timelineStart: Date,
  timelineEnd: Date,
  pxPerDay: number,
): GeneratedColumns {
  const dayOffset = (d: Date) =>
    differenceInDays(startOfDay(d), startOfDay(timelineStart));

  // ── Month zoom ──
  if (zoom === "month") {
    const topColumns: HeaderColumn[] = [];
    const bottomColumns: HeaderColumn[] = [];

    // Top row: years
    let yearStart = new Date(timelineStart.getFullYear(), 0, 1);
    while (yearStart <= timelineEnd) {
      const yearEnd = new Date(yearStart.getFullYear() + 1, 0, 0);
      const visStart = yearStart < timelineStart ? timelineStart : yearStart;
      const visEnd = yearEnd > timelineEnd ? timelineEnd : yearEnd;
      topColumns.push({
        key: `y-${yearStart.getFullYear()}`,
        label: String(yearStart.getFullYear()),
        left: dayOffset(visStart) * pxPerDay,
        width: (differenceInDays(visEnd, visStart) + 1) * pxPerDay,
      });
      yearStart = new Date(yearStart.getFullYear() + 1, 0, 1);
    }

    // Bottom row: months
    let cur = startOfMonth(timelineStart);
    while (cur <= timelineEnd) {
      const daysInMo = getDaysInMonth(cur);
      bottomColumns.push({
        key: `m-${format(cur, "yyyy-MM")}`,
        label: format(cur, "MMM"),
        left: dayOffset(cur) * pxPerDay,
        width: daysInMo * pxPerDay,
      });
      cur = addMonths(cur, 1);
    }

    return { topColumns, bottomColumns };
  }

  // ── Week zoom ──
  if (zoom === "week") {
    const topColumns: HeaderColumn[] = [];
    const bottomColumns: HeaderColumn[] = [];

    // Top row: months
    let cur = startOfMonth(timelineStart);
    while (cur <= timelineEnd) {
      const monthEnd = endOfMonth(cur);
      const visStart = cur < timelineStart ? timelineStart : cur;
      const visEnd = monthEnd > timelineEnd ? timelineEnd : monthEnd;
      topColumns.push({
        key: `m-${format(cur, "yyyy-MM")}`,
        label: format(cur, "MMMM yyyy"),
        left: dayOffset(visStart) * pxPerDay,
        width: (differenceInDays(visEnd, visStart) + 1) * pxPerDay,
      });
      cur = addMonths(cur, 1);
    }

    // Bottom row: weeks (Monday-start)
    let weekCur = startOfWeek(timelineStart, { weekStartsOn: 1 });
    while (weekCur <= timelineEnd) {
      bottomColumns.push({
        key: `w-${format(weekCur, "yyyy-MM-dd")}`,
        label: format(weekCur, "MMM d"),
        left: dayOffset(weekCur) * pxPerDay,
        width: 7 * pxPerDay,
      });
      weekCur = addWeeks(weekCur, 1);
    }

    return { topColumns, bottomColumns };
  }

  // ── Day zoom ──
  if (zoom === "day") {
    const topColumns: HeaderColumn[] = [];
    const bottomColumns: HeaderColumn[] = [];

    // Top row: months
    let cur = startOfMonth(timelineStart);
    while (cur <= timelineEnd) {
      const monthEnd = endOfMonth(cur);
      const visStart = cur < timelineStart ? timelineStart : cur;
      const visEnd = monthEnd > timelineEnd ? timelineEnd : monthEnd;
      topColumns.push({
        key: `m-${format(cur, "yyyy-MM")}`,
        label: format(cur, "MMMM yyyy"),
        left: dayOffset(visStart) * pxPerDay,
        width: (differenceInDays(visEnd, visStart) + 1) * pxPerDay,
      });
      cur = addMonths(cur, 1);
    }

    // Bottom row: individual days
    let dayCur = startOfDay(timelineStart);
    while (dayCur <= timelineEnd) {
      const dow = dayCur.getDay();
      const isToday = isSameDay(dayCur, new Date());
      const isWeekend = dow === 0 || dow === 6;
      bottomColumns.push({
        key: `d-${format(dayCur, "yyyy-MM-dd")}`,
        label: format(dayCur, "d"),
        left: dayOffset(dayCur) * pxPerDay,
        width: pxPerDay,
        isToday,
        isWeekend,
      });
      dayCur = addDays(dayCur, 1);
    }

    return { topColumns, bottomColumns };
  }

  // ── Hour zoom ──
  const topColumns: HeaderColumn[] = [];
  const bottomColumns: HeaderColumn[] = [];
  const hourWidth = pxPerDay / 24;

  let dayCur = startOfDay(timelineStart);
  while (dayCur <= timelineEnd) {
    const dow = dayCur.getDay();
    const isToday = isSameDay(dayCur, new Date());
    const isWeekend = dow === 0 || dow === 6;

    topColumns.push({
      key: `d-${format(dayCur, "yyyy-MM-dd")}`,
      label: format(dayCur, "EEE, MMM d"),
      left: dayOffset(dayCur) * pxPerDay,
      width: pxPerDay,
      isToday,
      isWeekend,
    });

    for (let h = 0; h < 24; h++) {
      bottomColumns.push({
        key: `h-${format(dayCur, "yyyy-MM-dd")}-${h}`,
        label: h % 6 === 0 ? `${String(h).padStart(2, "0")}:00` : "",
        left: dayOffset(dayCur) * pxPerDay + h * hourWidth,
        width: hourWidth,
      });
    }

    dayCur = addDays(dayCur, 1);
  }

  return { topColumns, bottomColumns };
}

// ─── AssigneeAvatars ──────────────────────────────────────────────────────────

function AssigneeAvatars({
  assignees,
  maxVisible = 3,
}: {
  assignees: { id: number; fullName: string | null; email: string; avatarUrl: string | null }[];
  maxVisible?: number;
}) {
  const visible = assignees.slice(0, maxVisible);
  const extra = assignees.length - maxVisible;

  return (
    <div className="flex -space-x-1 shrink-0">
      {visible.map((a) =>
        a.avatarUrl ? (
          <img
            key={a.id}
            src={a.avatarUrl}
            alt={a.fullName ?? a.email}
            title={a.fullName ?? a.email}
            className="h-4 w-4 rounded-full border-2 border-card object-cover"
          />
        ) : (
          <div
            key={a.id}
            title={a.fullName ?? a.email}
            className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[8px] font-bold text-primary"
          >
            {(a.fullName ?? a.email).charAt(0).toUpperCase()}
          </div>
        ),
      )}
      {extra > 0 && (
        <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-muted text-[8px] font-medium text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}

// ─── TimelineView ─────────────────────────────────────────────────────────────

interface TimelineViewProps {
  tasks: TaskResponse[];
  project: Project | null;
  workspaceId: number;
  projectId: number;
}

export function TimelineView({ tasks, project, workspaceId, projectId }: TimelineViewProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Drag-to-pan state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  // ─── Timeline range ─────────────────────────────────────────────────────────
  const { timelineStart, timelineEnd } = useMemo(() => {
    const today = startOfDay(new Date());
    const dates: Date[] = [];

    if (project?.startDate) dates.push(startOfDay(new Date(project.startDate)));
    if (project?.endDate) dates.push(startOfDay(new Date(project.endDate)));
    for (const task of tasks) {
      if (task.startDate) dates.push(startOfDay(new Date(task.startDate)));
      if (task.dueDate) dates.push(startOfDay(new Date(task.dueDate)));
    }

    let rangeStart: Date;
    let rangeEnd: Date;

    if (dates.length === 0) {
      rangeStart = addMonths(today, -1);
      rangeEnd = addMonths(today, 3);
    } else {
      rangeStart = new Date(Math.min(...dates.map((d) => d.getTime())));
      rangeEnd = new Date(Math.max(...dates.map((d) => d.getTime())));
    }

    return {
      timelineStart: addDays(rangeStart, -TIMELINE_SIDE_PADDING),
      timelineEnd: addDays(rangeEnd, TIMELINE_SIDE_PADDING),
    };
  }, [project, tasks]);

  const pxPerDay = PX_PER_DAY[zoom];
  const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
  const totalWidth = Math.max(totalDays * pxPerDay, 1);

  // ─── Header columns ──────────────────────────────────────────────────────────
  const { topColumns, bottomColumns } = useMemo(
    () => generateTimeColumns(zoom, timelineStart, timelineEnd, pxPerDay),
    [zoom, timelineStart, timelineEnd, pxPerDay],
  );

  // ─── Rows ────────────────────────────────────────────────────────────────────
  const rows = useMemo<Row[]>(() => {
    const rootTasks = tasks.filter((t) => t.parentTaskId == null);

    if (groupBy === "none") {
      return [...rootTasks]
        .sort((a, b) => {
          const aD = getTaskEffectiveDates(a, project);
          const bD = getTaskEffectiveDates(b, project);
          return aD.start.getTime() - bD.start.getTime();
        })
        .map((task) => ({ type: "task", task }) as TaskRow);
    }

    if (groupBy === "status") {
      const result: Row[] = [];
      const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
      for (const status of statuses) {
        const groupTasks = rootTasks.filter((t) => t.status === status);
        if (groupTasks.length === 0) continue;
        const cfg = STATUS_GROUP_STYLE[status];
        result.push({
          type: "group",
          id: status,
          label: cfg.label,
          count: groupTasks.length,
          colorClass: cfg.colorClass,
        });
        if (!collapsedGroups.has(status)) {
          groupTasks
            .sort((a, b) => {
              const aD = getTaskEffectiveDates(a, project);
              const bD = getTaskEffectiveDates(b, project);
              return aD.start.getTime() - bD.start.getTime();
            })
            .forEach((task) => result.push({ type: "task", task }));
        }
      }
      return result;
    }

    // groupBy === "assignee"
    const assigneeMap = new Map<string, { label: string; tasks: TaskResponse[] }>();
    for (const task of rootTasks) {
      const key =
        task.assignees.length > 0 ? String(task.assignees[0].id) : "unassigned";
      const label =
        task.assignees.length > 0
          ? (task.assignees[0].fullName ?? task.assignees[0].email)
          : "Unassigned";
      if (!assigneeMap.has(key)) assigneeMap.set(key, { label, tasks: [] });
      assigneeMap.get(key)!.tasks.push(task);
    }

    const result: Row[] = [];
    for (const [key, { label, tasks: groupTasks }] of assigneeMap) {
      result.push({
        type: "group",
        id: key,
        label,
        count: groupTasks.length,
        colorClass: "text-foreground bg-muted border-border",
      });
      if (!collapsedGroups.has(key)) {
        groupTasks
          .sort((a, b) => {
            const aD = getTaskEffectiveDates(a, project);
            const bD = getTaskEffectiveDates(b, project);
            return aD.start.getTime() - bD.start.getTime();
          })
          .forEach((task) => result.push({ type: "task", task }));
      }
    }
    return result;
  }, [tasks, project, groupBy, collapsedGroups]);

  // ─── Row positions ───────────────────────────────────────────────────────────
  const rowPositions = useMemo(() => {
    let top = 0;
    return rows.map((row) => {
      const h = row.type === "group" ? GROUP_HEADER_HEIGHT : ROW_HEIGHT;
      const pos = { row, top, height: h };
      top += h;
      return pos;
    });
  }, [rows]);

  const totalBodyHeight = rowPositions.reduce((sum, p) => sum + p.height, 0) || ROW_HEIGHT;

  // ─── Today position ──────────────────────────────────────────────────────────
  const todayOffset = useMemo(
    () => Math.max(0, differenceInDays(startOfDay(new Date()), startOfDay(timelineStart)) * pxPerDay),
    [timelineStart, pxPerDay],
  );

  // ─── Scroll to today ─────────────────────────────────────────────────────────
  const scrollToToday = useCallback(() => {
    if (!containerRef.current) return;
    const visibleWidth = containerRef.current.clientWidth - LEFT_PANEL_WIDTH;
    containerRef.current.scrollLeft = Math.max(0, todayOffset - visibleWidth / 2);
  }, [todayOffset]);

  useEffect(() => {
    const t = setTimeout(scrollToToday, 80);
    return () => clearTimeout(t);
  }, [scrollToToday]);

  // ─── Drag-to-pan handlers ────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartScrollLeft.current = containerRef.current?.scrollLeft ?? 0;
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const dx = e.clientX - dragStartX.current;
    containerRef.current.scrollLeft = dragStartScrollLeft.current - dx;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = "";
  }, []);

  // ─── Toggle group ─────────────────────────────────────────────────────────────
  const toggleGroup = useCallback((id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ─── Empty state ─────────────────────────────────────────────────────────────
  if (tasks.filter((t) => t.parentTaskId == null).length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
        <GanttChart className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">No tasks to display on timeline</p>
        <p className="text-xs text-muted-foreground">Create tasks with dates to see them here.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-3"
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Zoom segmented control */}
        <div className="flex rounded-md border bg-muted p-0.5 gap-0.5">
          {(["hour", "day", "week", "month"] as ZoomLevel[]).map((z) => (
            <Button
              key={z}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-3 text-xs capitalize",
                zoom === z && "bg-background shadow-sm font-medium",
              )}
              onClick={() => setZoom(z)}
            >
              {z}
            </Button>
          ))}
        </div>

        {/* Group by */}
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="status">Group by Status</SelectItem>
            <SelectItem value="assignee">Group by Assignee</SelectItem>
          </SelectContent>
        </Select>

        {/* Today */}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={scrollToToday}>
          <CalendarDays className="h-3.5 w-3.5" />
          Today
        </Button>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
          {(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as TaskStatus[]).map((s) => {
            const style = STATUS_BAR[s];
            const label = STATUS_GROUP_STYLE[s].label;
            return (
              <div key={s} className="flex items-center gap-1">
                <span className={cn("h-2.5 w-4 rounded-sm border", style.bg, style.border)} />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Timeline Container ── */}
      <div
        ref={containerRef}
        className="relative rounded-lg border bg-card overflow-auto select-none"
        style={{ height: "calc(100vh - 310px)", minHeight: 420 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Inner wrapper — total scrollable width */}
        <div style={{ width: LEFT_PANEL_WIDTH + totalWidth, minWidth: "100%" }}>

          {/* ── HEADER — sticky top ── */}
          <div
            className="sticky top-0 z-20 flex border-b bg-card/95 backdrop-blur-sm"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Top-left corner — sticky both axes */}
            <div
              className="sticky left-0 z-30 flex items-end border-r bg-card/95 px-3 pb-1.5 shrink-0"
              style={{ width: LEFT_PANEL_WIDTH, height: HEADER_HEIGHT }}
            >
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Task
              </span>
            </div>

            {/* Time labels */}
            <div className="relative overflow-hidden" style={{ width: totalWidth }}>
              {/* Top row */}
              {topColumns.map((col) => (
                <div
                  key={col.key}
                  className={cn(
                    "absolute top-0 flex items-center border-r border-border/40 px-2",
                    col.isWeekend && "bg-muted/30",
                    col.isToday && "bg-primary/5",
                  )}
                  style={{ left: col.left, width: col.width, height: HEADER_TOP_HEIGHT }}
                >
                  <span className="truncate text-[11px] font-semibold text-foreground">
                    {col.label}
                  </span>
                </div>
              ))}

              {/* Bottom row */}
              {bottomColumns.map((col) => (
                <div
                  key={col.key}
                  className={cn(
                    "absolute flex items-center justify-center border-r border-border/30 text-[10px]",
                    col.isToday
                      ? "bg-primary/10 font-semibold text-primary"
                      : col.isWeekend
                        ? "bg-muted/30 text-muted-foreground"
                        : "text-muted-foreground",
                  )}
                  style={{
                    top: HEADER_TOP_HEIGHT,
                    left: col.left,
                    width: col.width,
                    height: HEADER_BOTTOM_HEIGHT,
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="relative flex" style={{ height: totalBodyHeight }}>

            {/* Left panel — sticky left */}
            <div
              className="sticky left-0 z-10 shrink-0 border-r bg-card"
              style={{ width: LEFT_PANEL_WIDTH }}
            >
              {rowPositions.map(({ row, top }) => {
                if (row.type === "group") {
                  const isCollapsed = collapsedGroups.has(row.id);
                  return (
                    <button
                      key={row.id}
                      className="absolute flex w-full items-center gap-2 border-b bg-muted/40 px-3 text-left hover:bg-muted/60 transition-colors"
                      style={{ top, height: GROUP_HEADER_HEIGHT }}
                      onClick={() => toggleGroup(row.id)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          row.colorClass,
                        )}
                      >
                        {row.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{row.count}</span>
                    </button>
                  );
                }

                const { task } = row;
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== "DONE";

                return (
                  <div
                    key={task.id}
                    className="absolute flex w-full items-center gap-2 border-b px-3 hover:bg-muted/30 transition-colors"
                    style={{ top, height: ROW_HEIGHT }}
                  >
                    {/* Priority dot */}
                    {task.priority ? (
                      <span
                        className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
                        title={`Priority: ${PRIORITY_LABEL[task.priority]}`}
                      />
                    ) : (
                      <span className="h-2 w-2 shrink-0" />
                    )}

                    {/* Task name */}
                    <button
                      className={cn(
                        "flex-1 truncate text-left text-xs font-medium hover:text-primary hover:underline",
                        isOverdue && "text-destructive",
                      )}
                      onClick={() =>
                        navigate(
                          `/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
                        )
                      }
                    >
                      {task.title}
                    </button>

                    {/* Assignee avatars */}
                    {task.assignees.length > 0 && (
                      <AssigneeAvatars assignees={task.assignees} maxVisible={3} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Timeline Grid ── */}
            <div className="relative" style={{ width: totalWidth }}>

              {/* Vertical column backgrounds (weekend, today) */}
              {bottomColumns.map((col) => (
                <div
                  key={col.key}
                  className={cn(
                    "absolute top-0 bottom-0 border-r border-border/20",
                    col.isWeekend && "bg-muted/20",
                    col.isToday && "bg-primary/5",
                  )}
                  style={{ left: col.left, width: col.width }}
                />
              ))}

              {/* Horizontal row separators */}
              {rowPositions.map(({ row, top, height }) => (
                <div
                  key={row.type === "group" ? `g-sep-${row.id}` : `t-sep-${row.task.id}`}
                  className={cn(
                    "absolute left-0 right-0 border-b border-border/30",
                    row.type === "group" && "bg-muted/30",
                  )}
                  style={{ top, height }}
                />
              ))}

              {/* Today line */}
              <div
                className="absolute top-0 bottom-0 z-10 w-[2px] bg-primary/70"
                style={{ left: todayOffset }}
              >
                <div className="absolute -top-0 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-sm font-semibold whitespace-nowrap shadow-sm">
                  Today
                </div>
              </div>

              {/* ── Task bars ── */}
              {rowPositions
                .filter(({ row }) => row.type === "task")
                .map(({ row, top }) => {
                  const { task } = row as TaskRow;
                  const { start, end } = getTaskEffectiveDates(task, project);

                  const barLeft =
                    differenceInDays(start, startOfDay(timelineStart)) * pxPerDay;
                  const barWidth = Math.max(
                    MIN_BAR_WIDTH,
                    (differenceInDays(end, start) + 1) * pxPerDay,
                  );
                  const barTop = top + BAR_VERTICAL_PADDING;
                  const barHeight = ROW_HEIGHT - BAR_VERTICAL_PADDING * 2;
                  const style = STATUS_BAR[task.status];
                  const isNarrow = barWidth < 72;

                  const dateLabel = `${format(start, "MMM d")} → ${format(end, "MMM d, yyyy")}`;
                  const priorityLabel = task.priority
                    ? `[${PRIORITY_LABEL[task.priority]}] `
                    : "";
                  const tooltipText = `${priorityLabel}${task.title}\n${dateLabel}`;

                  return (
                    <button
                      key={task.id}
                      title={tooltipText}
                      className={cn(
                        "absolute flex items-center gap-1.5 rounded-md border px-2 overflow-hidden",
                        "transition-all duration-150 hover:opacity-90 hover:shadow-md hover:-translate-y-px",
                        style.bg,
                        style.border,
                        style.text,
                      )}
                      style={{
                        left: barLeft,
                        top: barTop,
                        width: barWidth,
                        height: barHeight,
                      }}
                      onClick={() =>
                        navigate(
                          `/workspaces/${workspaceId}/projects/${projectId}/tasks/${task.id}`,
                        )
                      }
                    >
                      {/* Priority dot */}
                      {task.priority && (
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            PRIORITY_DOT[task.priority],
                          )}
                        />
                      )}

                      {/* Task title — hidden on very narrow bars */}
                      {!isNarrow && (
                        <span className="truncate text-[11px] font-medium leading-none flex-1">
                          {task.title}
                        </span>
                      )}

                      {/* Assignee avatars — hidden on narrow bars */}
                      {!isNarrow && task.assignees.length > 0 && (
                        <AssigneeAvatars assignees={task.assignees} maxVisible={2} />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
