import { useNavigate } from "react-router-dom";
import { Plus, FolderKanban, ArrowRight, Loader2 } from "lucide-react";

import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGetMyWorkspacesQuery } from "@/features/workspace/api/workspaceApi";
import { addRecent } from "@/features/workspace/workspaceSlice";

// ─── Mock task board ──────────────────────────────────────────────────────────
const mockTaskColumns = [
  {
    title: "To Do",
    items: [
      { title: "Create weekly plan", priority: "High", due: "Today" },
      { title: "Write API integration notes", priority: "Medium", due: "Tomorrow" },
      { title: "Prepare sprint checklist", priority: "Low", due: "Mar 03" },
    ],
  },
  {
    title: "Doing",
    items: [
      { title: "Dashboard layout revamp", priority: "High", due: "Today" },
      { title: "Refine auth flows", priority: "Medium", due: "Mar 02" },
    ],
  },
  {
    title: "Done",
    items: [
      { title: "Integrate reset password", priority: "High", due: "Completed" },
      { title: "Google OAuth login", priority: "High", due: "Completed" },
    ],
  },
];

// ─── Workspace quick-access section ──────────────────────────────────────────
function WorkspaceSection() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const recentIds = useAppSelector((s) => s.workspace.recentIds);
  const { data, isLoading } = useGetMyWorkspacesQuery();
  const allWorkspaces = data?.data ?? [];

  // Show recents first (up to 3), fill with newest if needed
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Workspaces</h2>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => navigate("/workspaces")}
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-20 items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : sortedWorkspaces.length === 0 ? (
        <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
          <Button size="sm" onClick={() => navigate("/workspaces")}>
            <Plus className="mr-2 h-4 w-4" />
            Create one
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedWorkspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleOpen(ws.id)}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-shadow hover:shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{ws.name}</p>
                <p className="truncate text-xs text-muted-foreground">
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
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Here's a quick overview.
        </p>
      </div>

      {/* Workspace Quick Access */}
      <WorkspaceSection />

      {/* Task Board */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">My Tasks</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {mockTaskColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <div className="min-h-[420px] space-y-3 rounded-lg border bg-muted/30 p-3">
                {column.items.map((task) => (
                  <Card key={task.title} className="p-4">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Priority: {task.priority}</span>
                      <span>{task.due}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-dashed bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Tip: Use sidebar shortcuts for quick navigation. Profile is accessible
          via the avatar button in the header.
        </p>
      </div>
    </div>
  );
}
