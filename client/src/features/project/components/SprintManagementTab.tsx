import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarDays, Flag, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import type {
  SprintResponse,
  SprintStatus,
} from "@/types/api";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useCreateSprintMutation,
  useDeleteSprintMutation,
  useGetProjectSprintsQuery,
  useUpdateSprintMutation,
} from "@/features/sprint/api/sprintApi";

type SprintFormState = {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
};

const STATUS_STYLE: Record<
  SprintStatus,
  { label: string; className: string }
> = {
  PLANNING: {
    label: "Planning",
    className: "text-slate-600 bg-slate-100 border-slate-200",
  },
  ACTIVE: {
    label: "Active",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "text-green-600 bg-green-50 border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "text-muted-foreground bg-muted border-border",
  },
};

function getTodayLocalDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function deriveDisplayStatus(sprint: SprintResponse): SprintStatus {
  if (sprint.status === "CANCELLED") {
    return "CANCELLED";
  }

  const today = getTodayLocalDateString();

  if (today < sprint.startDate) {
    return "PLANNING";
  }

  if (today > sprint.endDate) {
    return "COMPLETED";
  }

  return "ACTIVE";
}

function getTimelineMeta(sprint: SprintResponse) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(`${sprint.startDate}T00:00:00`);
  const end = new Date(`${sprint.endDate}T00:00:00`);
  const dayMs = 24 * 60 * 60 * 1000;

  if (today < start) {
    const startsIn = Math.floor((start.getTime() - today.getTime()) / dayMs);
    return {
      label: `Starts in ${startsIn} day${startsIn === 1 ? "" : "s"}`,
      className: "text-blue-600 bg-blue-50 border-blue-200",
    };
  }

  if (today > end) {
    const overdue = Math.floor((today.getTime() - end.getTime()) / dayMs);
    return {
      label: `Overdue ${overdue} day${overdue === 1 ? "" : "s"}`,
      className: "text-destructive bg-destructive/10 border-destructive/20",
    };
  }

  const remaining = Math.floor((end.getTime() - today.getTime()) / dayMs) + 1;
  return {
    label: `Remaining ${remaining} day${remaining === 1 ? "" : "s"}`,
    className: "text-green-700 bg-green-50 border-green-200",
  };
}

function buildInitialForm(sprint?: SprintResponse): SprintFormState {
  if (!sprint) {
    return {
      name: "",
      goal: "",
      startDate: getTodayLocalDateString(),
      endDate: getTodayLocalDateString(),
    };
  }

  return {
    name: sprint.name,
    goal: sprint.goal ?? "",
    startDate: sprint.startDate,
    endDate: sprint.endDate,
  };
}

export function SprintManagementTab({
  workspaceId,
  projectId,
  isManager,
}: {
  workspaceId: number;
  projectId: number;
  isManager: boolean;
}) {
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<SprintResponse | null>(null);
  const [form, setForm] = useState<SprintFormState>(buildInitialForm());
  const [sortMode, setSortMode] = useState<"END_ASC" | "OVERDUE_FIRST">("END_ASC");

  const [deleteTarget, setDeleteTarget] = useState<SprintResponse | null>(null);

  const { data, isLoading, isFetching } = useGetProjectSprintsQuery(
    { projectId, page: 0, size: 50 },
    { skip: isNaN(projectId) },
  );

  const sprints = useMemo(() => {
    const today = getTodayLocalDateString();
    const list = (data?.data?.data ?? []).slice();

    if (sortMode === "OVERDUE_FIRST") {
      list.sort((a, b) => {
        const aOver = a.endDate < today;
        const bOver = b.endDate < today;

        if (aOver !== bOver) {
          return aOver ? -1 : 1;
        }

        if (aOver && bOver) {
          return b.endDate.localeCompare(a.endDate);
        }

        return a.endDate.localeCompare(b.endDate);
      });

      return list;
    }

    list.sort((a, b) => a.endDate.localeCompare(b.endDate));
    return list;
  }, [data?.data?.data, sortMode]);

  const [createSprint, { isLoading: isCreating }] = useCreateSprintMutation();
  const [updateSprint, { isLoading: isUpdating }] = useUpdateSprintMutation();
  const [deleteSprint, { isLoading: isDeleting }] = useDeleteSprintMutation();

  const isSaving = isCreating || isUpdating;

  const openCreate = () => {
    setEditingSprint(null);
    setForm(buildInitialForm());
    setIsFormOpen(true);
  };

  const openEdit = (sprint: SprintResponse) => {
    setEditingSprint(sprint);
    setForm(buildInitialForm(sprint));
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Sprint name is required");
      return;
    }

    if (form.endDate < form.startDate) {
      toast.error("End date must be on or after start date");
      return;
    }

    const payload = {
      name: form.name.trim(),
      goal: form.goal.trim() || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    try {
      if (editingSprint) {
        await updateSprint({
          projectId,
          sprintId: editingSprint.id,
          ...payload,
        }).unwrap();
        toast.success("Sprint updated");
      } else {
        await createSprint({
          projectId,
          ...payload,
        }).unwrap();
        toast.success("Sprint created");
      }

      setIsFormOpen(false);
      setEditingSprint(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save sprint"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteSprint({ projectId, sprintId: deleteTarget.id }).unwrap();
      toast.success("Sprint deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete sprint"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Sprint Planning</p>
          <p className="text-xs text-muted-foreground">
            Sprints are optional. Tasks without sprint stay in "No Sprint".
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as "END_ASC" | "OVERDUE_FIRST")}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="END_ASC">End date (soonest)</SelectItem>
              <SelectItem value="OVERDUE_FIRST">Overdue first</SelectItem>
            </SelectContent>
          </Select>

          {isManager && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Sprint
            </Button>
          )}
        </div>
      </div>

      {(isLoading || isFetching) && (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border bg-muted/20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && sprints.length === 0 && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
          <Flag className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">No sprint yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can still work normally. Add sprint only when your team needs planning cycles.
            </p>
          </div>
          {isManager && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create first sprint
            </Button>
          )}
        </div>
      )}

      {!isLoading && sprints.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sprints.map((sprint) => {
            const displayStatus = deriveDisplayStatus(sprint);
            const statusCfg = STATUS_STYLE[displayStatus];
            const timelineMeta = getTimelineMeta(sprint);
            const completion =
              sprint.taskCount > 0
                ? Math.round((sprint.completedTaskCount / sprint.taskCount) * 100)
                : 0;

            return (
              <Card
                key={sprint.id}
                className="p-4 space-y-3 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                onClick={() =>
                  navigate(`/workspaces/${workspaceId}/projects/${projectId}/tasks?sprint=${sprint.id}`)
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{sprint.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(`${sprint.startDate}T00:00:00`), "MMM d, yyyy")} -{" "}
                        {format(new Date(`${sprint.endDate}T00:00:00`), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn("shrink-0 border", statusCfg.className)}
                  >
                    {statusCfg.label}
                  </Badge>
                </div>

                {sprint.goal && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{sprint.goal}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {sprint.completedTaskCount}/{sprint.taskCount} done
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 font-medium",
                      timelineMeta.className,
                    )}
                  >
                    {timelineMeta.label}
                  </span>
                  <span className="text-muted-foreground">
                    {sprint.completedTaskCount}/{sprint.taskCount} done
                  </span>
                </div>

                <Separator />

                {isManager && (
                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(sprint);
                      }}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(sprint);
                      }}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!isSaving) {
            setIsFormOpen(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSprint ? "Edit Sprint" : "Create Sprint"}</DialogTitle>
            <DialogDescription>
              Sprint is optional and designed to support teams who need time-boxed planning.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sprint-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Sprint name"
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Goal</Label>
              <Textarea
                id="sprint-goal"
                value={form.goal}
                onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))}
                placeholder="Optional sprint goal"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sprint-start">Start Date</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sprint-end">End Date</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !form.name.trim()}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSprint ? "Save Changes" : "Create Sprint"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sprint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;?
              Tasks inside this sprint will become unscheduled.
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
