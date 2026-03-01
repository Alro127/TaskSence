import { Card } from "@/components/ui/card";

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

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Temporary board with mock task cards. Real task data will be integrated in next sprint.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {mockTaskColumns.map((column) => (
          <div key={column.title} className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>

            <div className="space-y-3 rounded-lg border bg-muted/30 p-3 min-h-[420px]">
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

      <div className="rounded-lg border border-dashed bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Tip: Use sidebar shortcuts for quick navigation. Profile is moved to the right drawer via avatar button.
        </p>
      </div>
    </div>
  );
}
