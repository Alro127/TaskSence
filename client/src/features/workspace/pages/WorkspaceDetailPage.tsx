import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ChevronRight,
  FolderKanban,
  Loader2,
  Plus,
  Users,
  LayoutGrid,
  Settings,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";

import { useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MockProject } from "@/types/api";
import { addRecent, removeFromPinnedAndRecent } from "../workspaceSlice";
import {
  useGetWorkspaceByIdQuery,
  useUpdateWorkspaceMutation,
} from "../api/workspaceApi";
import { DeleteWorkspaceDialog } from "../components";

// ─── Mock projects ─────────────────────────────────────────────────────────────
const MOCK_PROJECTS: MockProject[] = [
  {
    id: 1,
    name: "Website Redesign",
    description: "Complete overhaul of the company website with new design system",
    taskCount: 12,
    completedTaskCount: 7,
    status: "active",
    updatedAt: "2026-03-01",
  },
  {
    id: 2,
    name: "Mobile App v2",
    description: "Rebuild the mobile application with improved performance",
    taskCount: 24,
    completedTaskCount: 10,
    status: "active",
    updatedAt: "2026-03-02",
  },
  {
    id: 3,
    name: "API Integration",
    description: "Integrate third-party services for analytics and payments",
    taskCount: 8,
    completedTaskCount: 8,
    status: "completed",
    updatedAt: "2026-02-20",
  },
  {
    id: 4,
    name: "Design System",
    description: "Build a unified component library for all products",
    taskCount: 15,
    completedTaskCount: 3,
    status: "active",
    updatedAt: "2026-02-28",
  },
  {
    id: 5,
    name: "Legacy Migration",
    description: "Migrate legacy codebase to modern stack",
    taskCount: 30,
    completedTaskCount: 0,
    status: "archived",
    updatedAt: "2026-01-15",
  },
];

// ─── Project Card ───────────────────────────────────────────────────────────────
const statusConfig = {
  active: { label: "Active", icon: Clock, class: "text-blue-500 bg-blue-50 border-blue-200" },
  completed: { label: "Completed", icon: CheckCircle2, class: "text-green-500 bg-green-50 border-green-200" },
  archived: { label: "Archived", icon: Archive, class: "text-muted-foreground bg-muted border-border" },
};

function ProjectCard({ project }: { project: MockProject }) {
  const progress =
    project.taskCount > 0
      ? Math.round((project.completedTaskCount / project.taskCount) * 100)
      : 0;
  const cfg = statusConfig[project.status];
  const StatusIcon = cfg.icon;

  return (
    <Card className="cursor-pointer rounded-lg p-0 gap-0 transition-shadow hover:shadow-md">
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight">{project.name}</h3>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              cfg.class,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {project.completedTaskCount}/{project.taskCount} tasks
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Settings form schema ───────────────────────────────────────────────────────
const settingsSchema = z.object({
  name: z
    .string()
    .min(1, "Workspace name is required")
    .max(255, "Name must not exceed 255 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
});
type SettingsFormData = z.infer<typeof settingsSchema>;

// ─── Main Page ──────────────────────────────────────────────────────────────────
export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const workspaceId = Number(id);

  const { data, isLoading, isError } = useGetWorkspaceByIdQuery(workspaceId, {
    skip: isNaN(workspaceId),
  });
  const workspace = data?.data ?? null;

  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  // Track as recent on mount
  useEffect(() => {
    if (!isNaN(workspaceId)) {
      dispatch(addRecent(workspaceId));
    }
  }, [workspaceId, dispatch]);

  // Pre-fill settings form
  useEffect(() => {
    if (workspace) {
      reset({ name: workspace.name, description: workspace.description ?? "" });
    }
  }, [workspace, reset]);

  const onSettingsSubmit = async (data: SettingsFormData) => {
    if (!workspace) return;
    try {
      await updateWorkspace({
        id: workspace.id,
        name: data.name,
        description: data.description || undefined,
      }).unwrap();
      toast.success("Workspace updated!");
    } catch {
      toast.error("Failed to update workspace");
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error / Not found ──
  if (isError || !workspace) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">Workspace not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/workspaces")}>
          Back to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/workspaces" className="hover:text-foreground transition-colors">
          Workspaces
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{workspace.name}</span>
      </nav>

      {/* ── Workspace Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FolderKanban className="h-6 w-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
          {workspace.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {workspace.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Projects
            <Badge variant="secondary" className="text-xs">
              {MOCK_PROJECTS.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Projects Tab ── */}
        <TabsContent value="projects" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {MOCK_PROJECTS.filter((p) => p.status === "active").length} active ·{" "}
              {MOCK_PROJECTS.filter((p) => p.status === "completed").length} completed ·{" "}
              {MOCK_PROJECTS.filter((p) => p.status === "archived").length} archived
            </p>
            <Button size="sm" variant="outline" disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_PROJECTS.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            {/* Ghost card */}
            <button className="flex min-h-[160px] w-full cursor-not-allowed flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 text-muted-foreground opacity-60">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">New Project</span>
              <span className="text-xs">(Coming soon)</span>
            </button>
          </div>
        </TabsContent>

        {/* ── Members Tab ── */}
        <TabsContent value="members" className="mt-6">
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Member management</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Invite and manage workspace members. Coming in a future sprint.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="mt-6 max-w-xl space-y-8">
          {/* General settings */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">General</h3>
              <p className="text-sm text-muted-foreground">
                Update workspace name and description.
              </p>
            </div>
            <form onSubmit={handleSubmit(onSettingsSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settings-name">Workspace name</Label>
                <Input
                  id="settings-name"
                  placeholder="e.g. Product Team"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-desc">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <textarea
                  id="settings-desc"
                  rows={3}
                  placeholder="What is this workspace for?"
                  className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!isDirty || isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      reset({
                        name: workspace.name,
                        description: workspace.description ?? "",
                      })
                    }
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </section>

          <Separator />

          {/* Danger Zone */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-destructive">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground">
                Irreversible and destructive actions.
              </p>
            </div>
            <div className="rounded-lg border border-destructive/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Delete this workspace</p>
                  <p className="text-xs text-muted-foreground">
                    Once deleted, all projects and data cannot be recovered.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  Delete workspace
                </Button>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* ── Delete Dialog ── */}
      <DeleteWorkspaceDialog
        workspace={workspace}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={() => {
          dispatch(removeFromPinnedAndRecent(workspaceId));
          navigate("/workspaces");
        }}
      />
    </div>
  );
}
