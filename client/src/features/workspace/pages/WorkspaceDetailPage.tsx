import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";
import {
  ChevronRight,
  FolderKanban,
  Loader2,
  Users,
  LayoutGrid,
  Settings,
} from "lucide-react";

import { useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { addRecent, removeFromPinnedAndRecent } from "../workspaceSlice";
import {
  useGetWorkspaceByIdQuery,
  useUpdateWorkspaceMutation,
} from "../api/workspaceApi";
import { DeleteWorkspaceDialog, WorkspaceMembersTab } from "../components";
import { useGetProjectsByWorkspaceQuery } from "@/features/project/api/projectApi";
import { ProjectCard, ProjectCardGhost } from "@/features/project/components";

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
  isPublic: z.boolean().optional(),
});
type SettingsFormData = z.infer<typeof settingsSchema>;

// ─── Main Page ──────────────────────────────────────────────────────────────────
export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const workspaceId = Number(id);
  const defaultTab = searchParams.get("tab") ?? "projects";
  const [projectPage, setProjectPage] = useState(0);
  const PAGE_SIZE = 9;

  const { data, isLoading, isError } = useGetWorkspaceByIdQuery(workspaceId, {
    skip: isNaN(workspaceId),
  });
  const workspace = data?.data ?? null;

  const { data: projectsData, isLoading: isProjectsLoading } =
    useGetProjectsByWorkspaceQuery(
      { workspaceId, page: projectPage, size: PAGE_SIZE },
      { skip: isNaN(workspaceId) }
    );
  const projects = projectsData?.data?.data ?? [];
  const totalProjects = projectsData?.data?.totalElements ?? 0;
  const totalProjectPages = Math.max(projectsData?.data?.totalPages ?? 1, 1);

  const workspacePermissions = workspace?.permissions ?? [];
  const hasWorkspacePermission = (...keys: string[]) =>
    keys.some((key) => workspacePermissions.includes(key));
  const canManageSettings = hasWorkspacePermission("UPDATE");
  const canCreateProject = hasWorkspacePermission("CREATE_PROJECT");
  const canDeleteWorkspace = hasWorkspacePermission("DELETE");

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
      reset({ name: workspace.name, description: workspace.description ?? "", isPublic: workspace.isPublic ?? false });
    }
  }, [workspace, reset]);

  const onSettingsSubmit = async (data: SettingsFormData) => {
    if (!workspace) return;
    try {
      await updateWorkspace({
        id: workspace.id,
        name: data.name,
        description: data.description || undefined,
        isPublic: data.isPublic,
      }).unwrap();
      toast.success("Workspace updated!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update workspace"));
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
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
          <FolderKanban className="h-6 w-6 text-[#233a87]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#444651] mb-1">Workspace</p>
          <h1
            className="text-2xl font-bold text-[#1a1c1b]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
          >
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="mt-1 text-sm text-[#444651]">
              {workspace.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={defaultTab}>
        <div className="overflow-x-auto hide-scrollbar">
          <TabsList>
            <TabsTrigger value="projects" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Projects
              <Badge variant="secondary" className="text-xs">
                {isProjectsLoading ? "…" : totalProjects}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            {canManageSettings && (
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ── Projects Tab ── */}
        <TabsContent value="projects" className="mt-6 space-y-4">
          {isProjectsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {projects.filter((p) => p.status === "ACTIVE").length} active ·{" "}
                {projects.filter((p) => p.status === "COMPLETED").length} completed ·{" "}
                {projects.filter((p) => p.status === "ARCHIVED").length} archived
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    workspaceId={workspaceId}
                    workspaceName={workspace.name}
                  />
                ))}
                {canCreateProject && projectPage === totalProjectPages - 1 && (
                  <ProjectCardGhost
                    onClick={() => navigate(`/workspaces/${workspaceId}/projects/new`)}
                  />
                )}
              </div>

              {totalProjectPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setProjectPage((p) => Math.max(0, p - 1))}
                        aria-disabled={projectPage === 0}
                        className={projectPage === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalProjectPages }, (_, i) => {
                      const showPage =
                        i === 0 ||
                        i === totalProjectPages - 1 ||
                        Math.abs(i - projectPage) <= 1;
                      if (!showPage) {
                        if (i === 1 || i === totalProjectPages - 2) {
                          return (
                            <PaginationItem key={`ellipsis-${i}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={i === projectPage}
                            onClick={() => setProjectPage(i)}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setProjectPage((p) => Math.min(totalProjectPages - 1, p + 1))}
                        aria-disabled={projectPage === totalProjectPages - 1}
                        className={projectPage === totalProjectPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Members Tab ── */}
        <TabsContent value="members" className="mt-6">
          <WorkspaceMembersTab workspaceId={workspaceId} />
        </TabsContent>

        {/* ── Settings Tab ── */}
        {canManageSettings && (
          <TabsContent value="settings" className="mt-6 w-full max-w-xl space-y-8">
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="settings-public"
                    className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    {...register("isPublic")}
                  />
                  <Label htmlFor="settings-public" className="cursor-pointer font-normal">
                    Make this workspace public
                    <span className="ml-1 text-xs text-muted-foreground">
                      (Anyone can view it)
                    </span>
                  </Label>
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
                          isPublic: workspace.isPublic ?? false,
                        })
                      }
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </section>

            {/* Danger Zone — OWNER only */}
            {canDeleteWorkspace && (
              <>
                <div className="h-px bg-[#efeeec]" />

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
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Delete this workspace</p>
                        <p className="text-xs text-muted-foreground">
                          Once deleted, all projects and data cannot be recovered.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setIsDeleteOpen(true)}
                      >
                        Delete workspace
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </TabsContent>
        )}
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
