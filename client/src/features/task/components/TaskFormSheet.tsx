import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import type { TaskPriority, TaskResponse } from "@/types/api";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
import { useCreateTaskMutation, useUpdateTaskMutation } from "../api/taskApi";
import { useGetMembersQuery } from "@/features/project/api/projectMemberApi";
import { useGetProjectSprintsQuery } from "@/features/sprint/api/sprintApi";
import { useGetTagsByProjectQuery } from "@/features/tag/api";
import { TagBadge } from "@/features/tag/components";

interface TaskFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  /** When provided, the sheet is in edit mode */
  task?: TaskResponse;
  /** Pre-fill parentTaskId when adding a subtask */
  parentTaskId?: number;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function TaskFormSheet({
  open,
  onOpenChange,
  projectId,
  task,
  parentTaskId,
}: TaskFormSheetProps) {
  const isEdit = !!task;
  const isSubtask = !isEdit && parentTaskId != null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "none">("none");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sprintSelection, setSprintSelection] = useState<string>("NONE");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);

  const { data: membersData } = useGetMembersQuery(
    { projectId, page: 0, size: 100 },
    { skip: !open },
  );
  const members = membersData?.data?.data ?? [];

  const { data: sprintsData } = useGetProjectSprintsQuery(
    { projectId, page: 0, size: 100 },
    { skip: !open },
  );
  const sprints = sprintsData?.data?.data ?? [];

  const { data: tagsData } = useGetTagsByProjectQuery(projectId, {
    skip: !open,
  });
  const projectTags = tagsData?.data ?? [];

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const isLoading = isCreating || isUpdating;

  // Populate form when editing
  useEffect(() => {
    if (open && task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority ?? "none");
      setStartDate(task.startDate ? toDatetimeLocal(task.startDate) : "");
      setDueDate(task.dueDate ? toDatetimeLocal(task.dueDate) : "");
      setSprintSelection(task.sprintId != null ? String(task.sprintId) : "NONE");
      setAssigneeIds(task.assignees.map((a) => a.id));
      setTagIds((task.tags ?? []).map((tag) => tag.id));
    } else if (open && !task) {
      setTitle("");
      setDescription("");
      setPriority("none");
      setStartDate("");
      setDueDate("");
      setSprintSelection("NONE");
      setAssigneeIds([]);
      setTagIds([]);
    }
  }, [open, task]);

  function toggleAssignee(userId: number) {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  function toggleTag(tagId: number) {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      toast.error("Due date must be on or after the start date");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority !== "none" ? priority : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      sprintId: sprintSelection !== "NONE" ? Number(sprintSelection) : undefined,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
    };

    try {
      if (isEdit && task) {
        await updateTask({
          projectId,
          taskId: task.id,
          ...payload,
          removeSprint: sprintSelection === "NONE" && task.sprintId != null,
        }).unwrap();
        toast.success("Task updated");
      } else {
        await createTask({
          projectId,
          ...payload,
          parentTaskId: parentTaskId ?? undefined,
        }).unwrap();
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, isEdit ? "Failed to update task" : "Failed to create task"));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto" showOverlay={false}>
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Edit Task" : isSubtask ? "New Subtask" : "New Task"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update task details."
              : isSubtask
                ? "Add a subtask with full details."
                : "Add a new task to this project."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4 px-4 pb-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={255}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority | "none")}
            >
              <SelectTrigger>
                <SelectValue placeholder="No priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No priority</SelectItem>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <input
                id="start-date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <input
                id="due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Sprint */}
          <div className="space-y-2">
            <Label>Sprint</Label>
            <Select value={sprintSelection} onValueChange={setSprintSelection}>
              <SelectTrigger>
                <SelectValue placeholder="No Sprint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No Sprint</SelectItem>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.id} value={String(sprint.id)}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignees */}
          {members.length > 0 && (
            <div className="space-y-2">
              <Label>Assignees</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {members.map((m) => {
                  const checked = assigneeIds.includes(m.user.id);
                  return (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssignee(m.user.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      {m.user.avatarUrl ? (
                        <img
                          src={m.user.avatarUrl}
                          alt={m.user.fullName ?? m.user.email}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {(m.user.fullName ?? m.user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate text-sm">
                        {m.user.fullName ?? m.user.email}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {projectTags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>

              {tagIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/20 p-2">
                  {projectTags
                    .filter((tag) => tagIds.includes(tag.id))
                    .map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                </div>
              )}

              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {projectTags.map((tag) => {
                  const checked = tagIds.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <TagBadge tag={tag} />
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTag(tag.id)}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <SheetFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : isSubtask ? "Create Subtask" : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
