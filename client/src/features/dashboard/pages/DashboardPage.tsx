import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FolderKanban,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  Users,
  Calendar,
  ChevronRight,
  Target,
  Bell,
  Folder,
  Activity,
  Timer,
  User,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { useGetMyWorkspacesQuery } from "@/features/workspace/api/workspaceApi";
import { addRecent } from "@/features/workspace/workspaceSlice";
import {
  useGetDashboardSummaryQuery,
  useGetActiveProjectsQuery,
  useGetMyTasksQuery,
  useGetUpcomingDeadlinesQuery,
  type TaskFilter,
  type DeadlineType,
} from "@/features/dashboard/api/dashboardApi";
import { useGetNotificationsQuery } from "@/features/notification/api/notificationApi";
import {
  getNotificationText,
  getNotificationTarget,
} from "@/features/notification/utils/notificationUtils";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};


// ─── Status / Priority configs ────────────────────────────────────────────────
const PROJECT_STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "text-[#006a61] bg-[rgba(0,106,97,0.08)] border-[rgba(0,106,97,0.2)]",
  },
  ON_HOLD: {
    label: "On Hold",
    badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]",
  },
  ARCHIVED: {
    label: "Archived",
    badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]",
  },
} as const;

const TASK_STATUS_CONFIG = {
  TODO: { dot: "#c5c5d3" },
  IN_PROGRESS: { dot: "#233a87" },
  REVIEW: { dot: "#643300" },
  DONE: { dot: "#006a61" },
} as const;

const PRIORITY_CONFIG = {
  LOW: {
    label: "Low",
    badgeClass: "text-[#444651] bg-[rgba(68,70,81,0.08)] border-[rgba(68,70,81,0.2)]",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "text-[#233a87] bg-[rgba(35,58,135,0.08)] border-[rgba(35,58,135,0.2)]",
  },
  HIGH: {
    label: "High",
    badgeClass: "text-[#643300] bg-[rgba(100,51,0,0.08)] border-[rgba(100,51,0,0.2)]",
  },
  URGENT: {
    label: "Urgent",
    badgeClass: "text-[#ba1a1a] bg-[rgba(186,26,26,0.08)] border-[rgba(186,26,26,0.2)]",
  },
} as const;

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number | undefined;
  trend: string;
  trendUp: boolean;
  isLoading?: boolean;
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, trend, trendUp, isLoading }: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col gap-4"
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div>
        {isLoading ? (
          <div className="h-8 w-12 rounded bg-[#e9e8e6] animate-pulse" />
        ) : (
          <p
            className="text-2xl font-bold text-[#1a1c1b] leading-none"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
          >
            {value ?? 0}
          </p>
        )}
        <p className="text-xs text-[#444651] mt-1">{label}</p>
      </div>
      <p className={cn("text-[11px] font-medium flex items-center gap-1", trendUp ? "text-[#006a61]" : "text-[#ba1a1a]")}>
        <TrendingUp className={cn("h-3 w-3 shrink-0", !trendUp && "rotate-180")} />
        {trend}
      </p>
    </motion.div>
  );
}

// ─── Workspace Section ────────────────────────────────────────────────────────
function WorkspaceSection() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const recentIds = useAppSelector((s) => s.workspace.recentIds);
  const { data, isLoading } = useGetMyWorkspacesQuery();
  const allWorkspaces = data?.data?.data ?? [];

  const sortedWorkspaces = [
    ...recentIds.map((id) => allWorkspaces.find((w) => w.id === id)).filter(Boolean),
    ...allWorkspaces.filter((w) => !recentIds.includes(w.id)),
  ].slice(0, 4) as typeof allWorkspaces;

  const handleOpen = (id: number) => {
    dispatch(addRecent(id));
    navigate(`/workspaces/${id}`);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#444651]">
          Recent Workspaces
          {!isLoading && (
            <span className="rounded-full bg-[#e9e8e6] px-2 py-0.5 text-[10px] font-semibold text-[#444651] normal-case tracking-normal">
              {sortedWorkspaces.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => navigate("/workspaces")}
          className="flex items-center gap-1 text-xs font-semibold text-[#233a87] transition-opacity hover:opacity-70"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex items-center gap-3.5">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-[#e9e8e6] animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-2/3 rounded bg-[#e9e8e6] animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-[#e9e8e6] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedWorkspaces.length === 0 ? (
        <button
          onClick={() => navigate("/workspaces")}
          className="flex w-full min-h-[80px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-[#444651] transition-all hover:border-[#233a87]/40 hover:bg-[rgba(35,58,135,0.04)] hover:text-[#233a87]"
        >
          <Plus className="h-4 w-4" />
          <span className="text-xs font-medium">Create your first workspace</span>
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sortedWorkspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleOpen(ws.id)}
              className="ghost-border group flex items-center gap-3.5 rounded-xl bg-white px-5 py-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
                <FolderKanban className="h-4 w-4 text-[#233a87]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1a1c1b]">{ws.name}</p>
                <p className="truncate text-xs text-[#444651] mt-0.5">
                  {ws.description ?? "No description"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#444651] opacity-0 transition-opacity group-hover:opacity-40" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Active Projects Section ──────────────────────────────────────────────────
function ActiveProjectsSection() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useGetActiveProjectsQuery();

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#444651]">
          My Projects
          {!isLoading && (
            <span className="rounded-full bg-[#e9e8e6] px-2 py-0.5 text-[10px] font-semibold text-[#444651] normal-case tracking-normal">
              {projects.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => navigate("/workspaces")}
          className="flex items-center gap-1 text-xs font-semibold text-[#233a87] transition-opacity hover:opacity-70"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3">
              <div className="flex justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 rounded bg-[#e9e8e6] animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-[#e9e8e6] animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded-full bg-[#e9e8e6] animate-pulse" />
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#e9e8e6] animate-pulse" />
              <div className="flex justify-between">
                <div className="h-3 w-20 rounded bg-[#e9e8e6] animate-pulse" />
                <div className="h-3 w-16 rounded bg-[#e9e8e6] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)]">
            <FolderKanban className="h-5 w-5 text-[#233a87]" />
          </div>
          <p className="text-xs text-[#444651]">No active projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project) => {
            const statusCfg = PROJECT_STATUS_CONFIG[project.status];
            return (
              <button
                key={project.id}
                onClick={() =>
                  navigate(`/workspaces/${project.workspaceId}/projects/${project.id}`)
                }
                className="ghost-border rounded-xl bg-white p-5 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px] space-y-3.5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1a1c1b]">{project.name}</p>
                    <p className="text-xs text-[#444651] mt-0.5">{project.workspaceName}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      statusCfg.badgeClass
                    )}
                  >
                    {statusCfg.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#444651]">
                    <span>{project.taskCount} tasks</span>
                    <span className="font-medium text-[#1a1c1b]">{project.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(35,58,135,0.1)]">
                    <div
                      className="h-full rounded-full bg-[#233a87] transition-all"
                      style={{ width: `${Math.min(project.progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-[#444651]">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    <span>{project.memberCount} members</span>
                  </div>
                  {project.overdueCount > 0 ? (
                    <span className="font-medium text-[#ba1a1a]">
                      {project.overdueCount} overdue
                    </span>
                  ) : project.endDate ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{project.endDate}</span>
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── My Tasks Section ─────────────────────────────────────────────────────────
const TASK_TABS: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
];

function MyTasksSection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TaskFilter>("all");

  const { data: tasksPage, isLoading } = useGetMyTasksQuery({ filter: activeTab, size: 20 });
  const { data: overdueCount } = useGetDashboardSummaryQuery(undefined, {
    selectFromResult: ({ data }) => ({ data: data?.overdueTasks ?? 0 }),
  });

  const filteredTasks = tasksPage?.data ?? [];

  return (
    <section id="my-tasks-section">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#444651]">
          My Tasks
          {tasksPage && (
            <span className="rounded-full bg-[#e9e8e6] px-2 py-0.5 text-[10px] font-semibold text-[#444651] normal-case tracking-normal">
              {tasksPage.totalElements}
            </span>
          )}
        </h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-3 w-fit rounded-lg bg-[#f4f3f1] p-1">
        {TASK_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-white text-[#1a1c1b] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                : "text-[#444651] hover:text-[#1a1c1b]"
            )}
          >
            {tab.label}
            {tab.id === "overdue" && (overdueCount ?? 0) > 0 && (
              <span className="rounded-full bg-[rgba(186,26,26,0.12)] px-1.5 py-px text-[10px] font-semibold text-[#ba1a1a]">
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="ghost-border overflow-hidden rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {isLoading ? (
          <div>
            {[1, 2, 3, 4].map((i, idx, arr) => (
              <div
                key={i}
                className={cn("flex items-center gap-3 px-5 py-3.5", idx < arr.length - 1 && "border-b border-[#efeeec]")}
              >
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#e9e8e6] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-2/3 rounded bg-[#e9e8e6] animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-[#e9e8e6] animate-pulse" />
                </div>
                <div className="h-5 w-14 rounded-full bg-[#e9e8e6] animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-[#006a61] opacity-40" />
            <p className="text-sm font-semibold text-[#1a1c1b]">All clear!</p>
            <p className="text-xs text-[#444651]">No tasks in this filter.</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => {
            const statusDot = TASK_STATUS_CONFIG[task.status]?.dot ?? "#c5c5d3";
            const priorityCfg = task.priority ? PRIORITY_CONFIG[task.priority] : null;
            const isLast = idx === filteredTasks.length - 1;
            const now = new Date();
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const isTaskOverdue = dueDate ? dueDate < now && task.status !== "DONE" : false;
            const dueDateLabel = dueDate
              ? isToday(dueDate)
                ? "Today"
                : dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : null;

            return (
              <button
                key={task.id}
                onClick={() =>
                  navigate(`/workspaces/${task.workspaceId}/projects/${task.projectId}/tasks/${task.id}`)
                }
                className={cn(
                  "group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#faf9f7]",
                  !isLast && "border-b border-[#efeeec]"
                )}
              >
                {/* Status dot */}
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-full border-2"
                  style={{ borderColor: statusDot, background: task.status === "DONE" ? statusDot : "transparent" }}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm text-[#1a1c1b]",
                      task.status === "DONE" && "line-through text-[#444651]"
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#444651]">{task.projectName}</p>
                </div>

                {/* Right side */}
                <div className="flex shrink-0 items-center gap-2">
                  {priorityCfg && (
                    <span
                      className={cn(
                        "hidden sm:inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        priorityCfg.badgeClass
                      )}
                    >
                      {priorityCfg.label}
                    </span>
                  )}
                  {dueDateLabel && (
                    <span
                      className={cn(
                        "min-w-[52px] text-right text-[11px]",
                        isTaskOverdue ? "font-medium text-[#ba1a1a]" : "text-[#444651]"
                      )}
                    >
                      {dueDateLabel}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-[#444651] opacity-0 transition-opacity group-hover:opacity-40" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

// ─── Quick Actions Card ───────────────────────────────────────────────────────
function QuickActionsCard() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FolderKanban,
      label: "New Workspace",
      onClick: () => navigate("/workspaces", { state: { openCreate: true } }),
      color: "#233a87",
      bg: "rgba(35,58,135,0.08)",
    },
    {
      icon: User,
      label: "My Profile",
      onClick: () => navigate("/profile"),
      color: "#006a61",
      bg: "rgba(0,106,97,0.08)",
    },
    {
      icon: ListTodo,
      label: "My Tasks",
      onClick: () =>
        document.getElementById("my-tasks-section")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      color: "#643300",
      bg: "rgba(100,51,0,0.08)",
    },
    // {
    //   icon: Settings,
    //   label: "Settings",
    //   onClick: () => navigate("/settings"),
    //   color: "#444651",
    //   bg: "rgba(68,70,81,0.08)",
    // },
  ];

  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#444651]">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="group flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-all hover:bg-[#f4f3f1]"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                style={{ background: action.bg }}
              >
                <Icon className="h-4 w-4" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-[#444651] group-hover:text-[#1a1c1b]">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Upcoming Deadlines Card ──────────────────────────────────────────────────
const DEADLINE_TYPE_CONFIG: Record<DeadlineType, { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bg: string }> = {
  TASK:    { icon: ListTodo,     color: "#643300", bg: "rgba(100,51,0,0.08)"    },
  SPRINT:  { icon: Timer,        color: "#233a87", bg: "rgba(35,58,135,0.08)"   },
  PROJECT: { icon: Target,       color: "#006a61", bg: "rgba(0,106,97,0.08)"    },
};

function formatDeadlineDate(dateStr: string): { label: string; isToday: boolean; isPast: boolean } {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffDays = Math.round((date.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
  if (diffDays === 0) return { label: "Today", isToday: true, isPast: false };
  if (diffDays === 1) return { label: "Tomorrow", isToday: false, isPast: false };
  if (diffDays < 0) return { label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), isToday: false, isPast: true };
  return { label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), isToday: false, isPast: false };
}

function UpcomingDeadlinesCard() {
  const navigate = useNavigate();
  const { data: deadlines = [], isLoading } = useGetUpcomingDeadlinesQuery({ days: 7 });

  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#444651]">
        Upcoming Deadlines
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div className="h-7 w-7 shrink-0 rounded-md bg-[#e9e8e6] animate-pulse" />
              <div className="h-3 flex-1 rounded bg-[#e9e8e6] animate-pulse" />
              <div className="h-3 w-10 shrink-0 rounded bg-[#e9e8e6] animate-pulse" />
            </div>
          ))}
        </div>
      ) : deadlines.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#444651]">No deadlines in the next 7 days.</p>
      ) : (
        <div className="space-y-0.5">
          {deadlines.map((deadline, idx) => {
            const cfg = DEADLINE_TYPE_CONFIG[deadline.type];
            const Icon = cfg.icon;
            const { label, isToday: isDueToday, isPast } = formatDeadlineDate(deadline.date);
            const isLast = idx === deadlines.length - 1;
            const target = deadline.type === "PROJECT"
              ? `/workspaces/${deadline.workspaceId}/projects/${deadline.id}`
              : `/workspaces/${deadline.workspaceId}/projects/${deadline.projectId}`;

            return (
              <div key={`${deadline.type}-${deadline.id}`}>
                <button
                  onClick={() => navigate(target)}
                  className="flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:bg-[#faf9f7]"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ background: cfg.bg }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-xs text-[#1a1c1b]">{deadline.label}</p>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-medium",
                      isDueToday || isPast ? "text-[#ba1a1a]" : "text-[#444651]"
                    )}
                  >
                    {label}
                  </span>
                </button>
                {!isLast && <div className="ml-10 h-px bg-[#efeeec]" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Recent Activity Card ─────────────────────────────────────────────────────
function notificationIconConfig(type: string): { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bg: string } {
  if (type.startsWith("TASK"))    return { icon: ListTodo,     color: "#643300", bg: "rgba(100,51,0,0.08)"   };
  if (type.startsWith("COMMENT")) return { icon: Activity,     color: "#444651", bg: "rgba(68,70,81,0.08)"   };
  if (type.startsWith("PROJECT")) return { icon: Folder,       color: "#233a87", bg: "rgba(35,58,135,0.08)"  };
  return                                 { icon: Bell,          color: "#233a87", bg: "rgba(35,58,135,0.08)"  };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function RecentActivityCard() {
  const navigate = useNavigate();
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);
  const { data, isLoading } = useGetNotificationsQuery({ limit: 5 });
  const notifications = data?.data ?? [];

  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#444651]">
          Recent Activity
        </h3>
        {unreadCount > 0 && (
          <span className="rounded-full bg-[#233a87] px-2 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount} new
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 py-1.5">
              <div className="mt-0.5 h-7 w-7 shrink-0 rounded-md bg-[#e9e8e6] animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-full rounded bg-[#e9e8e6] animate-pulse" />
                <div className="h-2.5 w-2/3 rounded bg-[#e9e8e6] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#444651]">No recent activity.</p>
      ) : (
        <div className="space-y-0.5">
          {notifications.map((notif, idx) => {
            const { icon: Icon, color, bg } = notificationIconConfig(notif.type);
            const { title, description } = getNotificationText(notif);
            const target = getNotificationTarget(notif);
            const isLast = idx === notifications.length - 1;

            return (
              <div key={notif.id}>
                <button
                  onClick={() => target && navigate(target)}
                  className="flex w-full items-start gap-3 rounded-lg py-2 text-left transition-colors hover:bg-[#faf9f7]"
                >
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ background: bg }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs leading-snug text-[#1a1c1b]", !notif.read && "font-medium")}>
                      {title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#444651]">{description}</p>
                  </div>
                  <span className="mt-0.5 shrink-0 text-[11px] text-[#444651]">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </button>
                {!isLast && <div className="ml-10 h-px bg-[#efeeec]" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummaryQuery();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const firstName = currentUser?.fullName?.split(" ")[0] ?? null;

  const statCards = [
    {
      id: "total-tasks",
      icon: ListTodo,
      iconColor: "#233a87",
      iconBg: "rgba(35,58,135,0.08)",
      label: "Total Tasks",
      value: summary?.totalTasks,
      trend: "Assigned to you",
      trendUp: true,
    },
    {
      id: "completed",
      icon: CheckCircle2,
      iconColor: "#006a61",
      iconBg: "rgba(0,106,97,0.08)",
      label: "Completed",
      value: summary?.completedTasks,
      trend: "Tasks done",
      trendUp: true,
    },
    {
      id: "overdue",
      icon: AlertCircle,
      iconColor: "#ba1a1a",
      iconBg: "rgba(186,26,26,0.08)",
      label: "Overdue",
      value: summary?.overdueTasks,
      trend: (summary?.overdueTasks ?? 0) > 0 ? "Needs attention" : "All on track",
      trendUp: (summary?.overdueTasks ?? 0) === 0,
    },
    {
      id: "active-projects",
      icon: FolderKanban,
      iconColor: "#643300",
      iconBg: "rgba(100,51,0,0.08)",
      label: "Active Projects",
      value: summary?.activeProjects,
      trend: "You're a member of",
      trendUp: true,
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-6 pb-10"
    >
      {/* ── Greeting header ── */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#444651]">
          {today}
        </p>
        <h1
          className="text-3xl font-bold text-[#1a1c1b] sm:text-4xl"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
        >
          {firstName ? `Hello, ${firstName}.` : "Hello."}
        </h1>
        <p className="mt-1.5 text-sm text-[#444651]">
          Here's what's happening across your workspaces.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {statCards.map((stat) => (
          <StatCard key={stat.id} {...stat} isLoading={summaryLoading} />
        ))}
      </motion.div>

      {/* ── Main 2-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_288px]">

        {/* ── Left: main content ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="min-w-0 space-y-6"
        >
          <WorkspaceSection />
          <div className="h-px bg-[#efeeec]" />
          <ActiveProjectsSection />
          <div className="h-px bg-[#efeeec]" />
          <MyTasksSection />
        </motion.div>

        {/* ── Right: sidebar ── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          className="space-y-4"
        >
          <QuickActionsCard />
          <UpcomingDeadlinesCard />
          <RecentActivityCard />
        </motion.div>
      </div>
    </motion.div>
  );
}
