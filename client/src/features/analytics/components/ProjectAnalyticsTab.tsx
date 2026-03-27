import { Loader2, AlertCircle, CalendarClock, Zap, TrendingUp, CheckCircle2, Users } from "lucide-react";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import type { ProjectMember, SprintResponse } from "@/types/api";
import { useGetProjectAnalyticsQuery } from "../api/analyticsApi";

// ─── Colour maps ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  TODO: "#444651", IN_PROGRESS: "#233a87", REVIEW: "#643300", DONE: "#006a61",
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "#444651", MEDIUM: "#233a87", HIGH: "#643300", URGENT: "#ba1a1a",
};
const STATUS_LABEL: Record<string, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", REVIEW: "Review", DONE: "Done",
};
const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent",
};

// ─── Health score helpers ─────────────────────────────────────────────────────

function healthColor(score: number) {
  if (score >= 75) return { bg: "bg-[rgba(0,106,97,0.08)]", text: "text-[#006a61]", bar: "#006a61", label: "Healthy" };
  if (score >= 50) return { bg: "bg-[rgba(100,51,0,0.08)]", text: "text-[#643300]", bar: "#643300", label: "At Risk" };
  return { bg: "bg-[rgba(186,26,26,0.08)]", text: "text-[#ba1a1a]", bar: "#ba1a1a", label: "Critical" };
}

// ─── Reusable components ──────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: {
  label: string; value: React.ReactNode; icon: React.ReactNode; accent?: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent ?? "bg-primary/10"}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function DistBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{count} <span className="text-xs">({pct}%)</span></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProjectAnalyticsTabProps {
  projectId: number;
  showMemberWorkload: boolean;
  members: ProjectMember[];
  sprints?: SprintResponse[];
}

export function ProjectAnalyticsTab({ projectId, showMemberWorkload, members, sprints = [] }: ProjectAnalyticsTabProps) {
  const { data, isLoading, isError } = useGetProjectAnalyticsQuery(projectId);
  const analytics = data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError || !analytics) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Could not load analytics. Make sure Elasticsearch is running.</p>
      </div>
    );
  }

  const health = healthColor(analytics.healthScore);
  const doneCount = analytics.statusDistribution["DONE"] ?? 0;
  const completionPct = analytics.totalTasks > 0 ? Math.round((doneCount / analytics.totalTasks) * 100) : 0;

  const statusTotal = Object.values(analytics.statusDistribution).reduce((s, v) => s + v, 0);
  const priorityTotal = Object.values(analytics.priorityDistribution).reduce((s, v) => s + v, 0);

  const statusChartData = Object.entries(analytics.statusDistribution).map(([k, v]) => ({
    name: STATUS_LABEL[k] ?? k, count: v, fill: STATUS_COLOR[k] ?? "#94a3b8",
  }));
  const priorityChartData = Object.entries(analytics.priorityDistribution).map(([k, v]) => ({
    name: PRIORITY_LABEL[k] ?? k, count: v, fill: PRIORITY_COLOR[k] ?? "#94a3b8",
  }));

  // Sprint velocity — enrich with sprint name
  const sprintChartData = analytics.sprintVelocity.map((sv) => {
    const sprint = sprints.find((s) => s.id === sv.sprintId);
    return { name: sprint?.name ?? `Sprint ${sv.sprintId}`, count: sv.completedCount };
  });

  // Member performance — enrich with member info
  const memberData = analytics.memberPerformance.map((mp) => {
    const member = members.find((m) => m.user.id === mp.userId);
    return {
      ...mp,
      name: member?.user.fullName ?? member?.user.email ?? `User ${mp.userId}`,
      avatarUrl: member?.user.avatarUrl ?? null,
    };
  });

  // Projected date display
  let projectedLabel = "No prediction (no velocity data)";
  let projectedClass = "text-muted-foreground";
  if (analytics.projectedCompletionDate) {
    const projected = new Date(analytics.projectedCompletionDate);
    const today = new Date();
    projectedLabel = format(projected, "MMM d, yyyy");
    projectedClass = projected < today ? "text-destructive font-semibold" : "text-foreground font-semibold";
  }

  return (
    <div className="space-y-6">

      {/* ── 1. Summary stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={analytics.totalTasks}
          icon={<TrendingUp className="h-5 w-5 text-primary" />} accent="bg-primary/10" />
        <StatCard label="Completed" value={`${completionPct}%`}
          icon={<CheckCircle2 className="h-5 w-5 text-[#006a61]" />} accent="bg-[rgba(0,106,97,0.08)]" />
        <StatCard label="Overdue" value={analytics.overdueCount}
          icon={<AlertCircle className="h-5 w-5 text-destructive" />} accent="bg-destructive/10" />
        <StatCard label="Velocity (30d)" value={`${analytics.avgDailyVelocity.toFixed(1)}/day`}
          icon={<Zap className="h-5 w-5 text-[#643300]" />} accent="bg-[rgba(100,51,0,0.08)]" />
      </div>

      {/* ── 2. Health score + Projected date ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Health Score */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-semibold">Project Health</h3>
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${health.bg} ${health.text}`}>
              {analytics.healthScore}
            </div>
            <div className="flex-1 space-y-1">
              <span className={`text-sm font-medium ${health.text}`}>{health.label}</span>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${analytics.healthScore}%`, backgroundColor: health.bar }} />
              </div>
              <p className="text-xs text-muted-foreground">
                Completion ×60% + On-time ×40%
              </p>
            </div>
          </div>
        </Card>

        {/* Projected Completion */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-semibold">Projected Completion</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
              <CalendarClock className="h-5 w-5 text-[#233a87]" />
            </div>
            <div>
              <p className={`text-lg ${projectedClass}`}>{projectedLabel}</p>
              <p className="text-xs text-muted-foreground">
                Based on avg {analytics.avgDailyVelocity.toFixed(1)} tasks/day ·{" "}
                {analytics.totalTasks - doneCount} tasks remaining
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 3. Status & Priority ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">Task Status</h3>
          {statusTotal === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
            <>
              <div className="space-y-3">
                {Object.entries(analytics.statusDistribution).map(([k, v]) => (
                  <DistBar key={k} label={STATUS_LABEL[k] ?? k} count={v} total={statusTotal} color={STATUS_COLOR[k] ?? "#94a3b8"} />
                ))}
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={statusChartData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">Task Priority</h3>
          {priorityTotal === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
            <>
              <div className="space-y-3">
                {Object.entries(analytics.priorityDistribution).map(([k, v]) => (
                  <DistBar key={k} label={PRIORITY_LABEL[k] ?? k} count={v} total={priorityTotal} color={PRIORITY_COLOR[k] ?? "#94a3b8"} />
                ))}
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={priorityChartData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>
      </div>

      {/* ── 4. Completion trend (30 days) ── */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Completion Trend — last 30 days</h3>
        {analytics.completionTrend.length === 0
          ? <p className="text-sm text-muted-foreground">No completed tasks in the last 30 days.</p>
          : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={analytics.completionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
      </Card>

      {/* ── 5. Sprint velocity ── */}
      {sprintChartData.length > 0 && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">Sprint Velocity (tasks completed per sprint)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sprintChartData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── 6. Member performance (MANAGER only) ── */}
      {showMemberWorkload && memberData.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Member Performance</h3>
          </div>
          <div className="space-y-4">
            {memberData.map((m) => {
              const ph = healthColor(m.performanceScore);
              return (
                <div key={m.userId} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.name} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{m.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ph.bg} ${ph.text}`}>
                          {m.performanceScore}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${m.performanceScore}%`, backgroundColor: ph.bar }} />
                  </div>
                  {/* Stats row */}
                  <div className="flex gap-4 text-xs text-muted-foreground pl-10">
                    <span>Assigned: <strong className="text-foreground">{m.assignedCount}</strong></span>
                    <span>Done: <strong className="text-[#006a61]">{m.completedCount}</strong></span>
                    <span>Overdue: <strong className={m.overdueCount > 0 ? "text-destructive" : "text-foreground"}>{m.overdueCount}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
