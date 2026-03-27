import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban, ArrowRight, Loader2, CheckCircle2, Clock, Circle } from "lucide-react";

import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { useGetMyWorkspacesQuery } from "@/features/workspace/api/workspaceApi";
import { addRecent } from "@/features/workspace/workspaceSlice";

// ─── Mock task board ──────────────────────────────────────────────────────────
const mockTaskColumns = [
  {
    id: "todo",
    title: "To Do",
    icon: Circle,
    color: "#444651",
    items: [
      { title: "Create weekly plan", priority: "High", due: "Today" },
      { title: "Write API integration notes", priority: "Medium", due: "Tomorrow" },
      { title: "Prepare sprint checklist", priority: "Low", due: "Mar 03" },
    ],
  },
  {
    id: "doing",
    title: "In Progress",
    icon: Clock,
    color: "#006a61",
    items: [
      { title: "Dashboard layout revamp", priority: "High", due: "Today" },
      { title: "Refine auth flows", priority: "Medium", due: "Mar 02" },
    ],
  },
  {
    id: "done",
    title: "Done",
    icon: CheckCircle2,
    color: "#233a87",
    items: [
      { title: "Integrate reset password", priority: "High", due: "Completed" },
      { title: "Google OAuth login", priority: "High", due: "Completed" },
    ],
  },
];

const priorityStyles: Record<string, string> = {
  High: "bg-[rgba(100,51,0,0.08)] text-[#643300]",
  Medium: "bg-[rgba(0,106,97,0.08)] text-[#006a61]",
  Low: "bg-[rgba(68,70,81,0.08)] text-[#444651]",
};

// ─── Workspace quick-access section ──────────────────────────────────────────
function WorkspaceSection() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const recentIds = useAppSelector((s) => s.workspace.recentIds);
  const { data, isLoading } = useGetMyWorkspacesQuery();
  const allWorkspaces = data?.data?.data ?? [];

  const sortedWorkspaces = [
    ...recentIds
      .map((id) => allWorkspaces.find((w) => w.id === id))
      .filter(Boolean),
    ...allWorkspaces.filter((w) => !recentIds.includes(w.id)),
  ].slice(0, 3) as typeof allWorkspaces;

  const handleOpen = (id: number) => {
    dispatch(addRecent(id));
    navigate(`/workspaces/${id}`);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-bold text-[#1a1c1b]"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
        >
          Recent Workspaces
        </h2>
        <button
          onClick={() => navigate("/workspaces")}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#233a87] transition-opacity hover:opacity-70"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-[#444651]" />
        </div>
      ) : sortedWorkspaces.length === 0 ? (
        <div className="flex items-center justify-between rounded-xl bg-[#f4f3f1] px-5 py-4">
          <p className="text-sm text-[#444651]">No workspaces yet.</p>
          <button
            onClick={() => navigate("/workspaces")}
            className="rounded-md bg-[#233a87] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="mr-1.5 inline h-3.5 w-3.5" />
            Create one
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedWorkspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleOpen(ws.id)}
              className="ghost-border flex items-center gap-3.5 rounded-xl bg-white px-5 py-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] hover:translate-y-[-1px]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
                <FolderKanban className="h-4.5 w-4.5 text-[#233a87]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a1c1b]">{ws.name}</p>
                <p className="truncate text-xs text-[#444651] mt-0.5">
                  {ws.description ?? "No description"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const currentUser = useAppSelector((s) => s.user.currentUser);

  return (
    <div className="space-y-10 max-w-5xl">

      {/* Editorial greeting */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#444651] mb-2">
          Welcome back
        </p>
        <h1
          className="text-4xl font-bold text-[#1a1c1b] leading-tight"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
        >
          {currentUser?.fullName
            ? `Hello, ${currentUser.fullName.split(" ")[0]}.`
            : "Hello."}
        </h1>
        <p className="mt-1.5 text-sm text-[#444651]">
          Here's a quick overview of your workspace.
        </p>
      </div>

      {/* Workspace Quick Access */}
      <WorkspaceSection />

      {/* Task Board */}
      <section>
        <h2
          className="text-base font-bold text-[#1a1c1b] mb-4"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
        >
          My Tasks
        </h2>

        <div className="grid gap-5 lg:grid-cols-3">
          {mockTaskColumns.map((column) => {
            const StatusIcon = column.icon;
            return (
              <div key={column.id}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <StatusIcon className="h-3.5 w-3.5 shrink-0" style={{ color: column.color }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: column.color }}>
                    {column.title}
                  </h3>
                  <span className="ml-auto text-xs font-medium text-[#444651]">
                    {column.items.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="min-h-[380px] space-y-2.5 rounded-xl bg-[#f4f3f1] p-3">
                  {column.items.map((task) => (
                    <div
                      key={task.title}
                      className="ghost-border rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:translate-x-0.5 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-[#1a1c1b] leading-snug">
                        {task.title}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span
                          className={[
                            "inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            priorityStyles[task.priority] ?? "",
                          ].join(" ")}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[11px] text-[#444651]">{task.due}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tip */}
      <div className="rounded-xl bg-[rgba(35,58,135,0.05)] border-l-4 border-[#233a87] px-5 py-4">
        <p className="text-sm text-[#233a87] font-medium">
          Tip: Use sidebar shortcuts for quick navigation. Your profile is accessible via the avatar in the header.
        </p>
      </div>
    </div>
  );
}
