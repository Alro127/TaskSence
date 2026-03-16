import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMinutes,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toast } from "sonner";
import { CalendarDays, Flag, Loader2 } from "lucide-react";
import { cn, getApiErrorMessage } from "@/lib/utils";

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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TaskPriority, TaskResponse } from "@/types/api";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../api/taskApi";
import { useGetMembersQuery } from "@/features/project/api/projectMemberApi";
import { useGetProjectSprintsQuery } from "@/features/sprint/api/sprintApi";
import { useGetTagsByProjectQuery } from "@/features/tag/api";
import { TagBadge } from "@/features/tag/components";
import { taskPriorityConfig } from "@/features/task/constants/taskPriority";

interface TaskFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  task?: TaskResponse;
  parentTaskId?: number;
}

interface TaskFormErrors {
  title?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
}

interface DateTimePickerFieldProps {
  placeholder: string;
  value: string;
  onChange: (nextValue: string) => void;
  isCreateMode: boolean;
  defaultTime: string;
  minDateTime?: Date;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 255;
const DESCRIPTION_MAX_LENGTH = 1024;
const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}T${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`;
}

function formatDateTimeLocal(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}T${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
}

function containsHtmlLikeText(value: string): boolean {
  return /<[^>]+>/.test(value);
}

function parseTimeString(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 9,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function buildDateTime(day: Date, hour: number, minute: number): Date {
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function validateTaskForm(values: {
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  isCreateMode: boolean;
}): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const trimmedTitle = values.title.trim();

  if (!trimmedTitle) {
    errors.title = "Title is required.";
  } else if (trimmedTitle.length < TITLE_MIN_LENGTH) {
    errors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters.`;
  } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters.`;
  }

  if (values.description.length > 0) {
    if (!values.description.trim()) {
      errors.description = "Description cannot be whitespace only.";
    } else if (values.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`;
    } else if (containsHtmlLikeText(values.description)) {
      errors.description = "Description cannot contain HTML/script tags.";
    }
  }

  const today = startOfDay(new Date());
  const parsedStartDate = values.startDate ? new Date(values.startDate) : null;
  const parsedDueDate = values.dueDate ? new Date(values.dueDate) : null;

  if (values.isCreateMode) {
    if (parsedStartDate && isBefore(startOfDay(parsedStartDate), today)) {
      errors.startDate = "Start date cannot be in the past.";
    }
    if (parsedDueDate && isBefore(startOfDay(parsedDueDate), today)) {
      errors.dueDate = "Due date cannot be in the past.";
    }
  }

  if (parsedStartDate && parsedDueDate) {
    if (isBefore(parsedDueDate, parsedStartDate)) {
      errors.dueDate = "Due date must be on or after the start date.";
    } else if (
      isSameDay(parsedStartDate, parsedDueDate) &&
      parsedDueDate.getTime() < parsedStartDate.getTime()
    ) {
      errors.dueDate = "Due time must be on or after the start time for the same day.";
    }
  }

  return errors;
}

function DateTimePickerField({
  placeholder,
  value,
  onChange,
  isCreateMode,
  defaultTime,
  minDateTime,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DateTimePickerFieldProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpenControlled = typeof controlledOpen === "boolean";
  const open = isOpenControlled ? (controlledOpen as boolean) : internalOpen;

  function setOpen(nextOpen: boolean) {
    if (!isOpenControlled) {
      setInternalOpen(nextOpen);
    }
    controlledOnOpenChange?.(nextOpen);
  }

  const today = useMemo(() => startOfDay(new Date()), []);
  const parsedValue = value ? new Date(value) : null;

  const [displayMonth, setDisplayMonth] = useState<Date>(
    startOfMonth(parsedValue ?? minDateTime ?? today),
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(
    parsedValue ? startOfDay(parsedValue) : null,
  );

  const defaultTimeParts = parseTimeString(defaultTime);
  const [hour, setHour] = useState<string>(
    String(parsedValue ? parsedValue.getHours() : defaultTimeParts.hour),
  );
  const [minute, setMinute] = useState<string>(
    String(parsedValue ? parsedValue.getMinutes() : defaultTimeParts.minute),
  );

  const minSelectableDay = minDateTime ? startOfDay(minDateTime) : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextParsed = value ? new Date(value) : null;
    setDisplayMonth(startOfMonth(nextParsed ?? minDateTime ?? today));
    setSelectedDay(nextParsed ? startOfDay(nextParsed) : null);

    const fallback = parseTimeString(defaultTime);
    setHour(String(nextParsed ? nextParsed.getHours() : fallback.hour));
    setMinute(String(nextParsed ? nextParsed.getMinutes() : fallback.minute));
  }, [open, value, minDateTime, defaultTime, today]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    for (let cursor = gridStart; !isAfter(cursor, gridEnd); cursor = addDays(cursor, 1)) {
      days.push(cursor);
    }
    return days;
  }, [displayMonth]);

  function isDisabledDay(day: Date): boolean {
    const normalized = startOfDay(day);

    if (isCreateMode && isBefore(normalized, today)) {
      return true;
    }

    if (minSelectableDay && isBefore(normalized, minSelectableDay)) {
      return true;
    }

    return false;
  }

  function applyDateTime(nextDate: Date) {
    const currentHour = Math.max(0, Math.min(23, Number(hour)));
    const currentMinute = Math.max(0, Math.min(59, Number(minute)));
    let composed = buildDateTime(nextDate, currentHour, currentMinute);

    if (minDateTime && isBefore(composed, minDateTime)) {
      composed = new Date(minDateTime);
    }

    onChange(formatDateTimeLocal(composed));
    setOpen(false);
  }

  function applyBusinessPreset(hour: number, minute: number) {
    const baseDay = selectedDay ?? minSelectableDay ?? today;
    let next = buildDateTime(baseDay, hour, minute);

    if (minDateTime && isBefore(next, minDateTime)) {
      next = new Date(minDateTime);
    }

    onChange(formatDateTimeLocal(next));
    setOpen(false);
  }

  function handleQuickAction(kind: "now" | "plus30" | "plus60" | "eod") {
    const base = new Date();
    let next = base;

    if (kind === "plus30") {
      next = addMinutes(base, 30);
    }
    if (kind === "plus60") {
      next = addMinutes(base, 60);
    }
    if (kind === "eod") {
      next = endOfDay(base);
    }

    if (isCreateMode && isBefore(startOfDay(next), today)) {
      next = buildDateTime(today, defaultTimeParts.hour, defaultTimeParts.minute);
    }

    if (minDateTime && isBefore(next, minDateTime)) {
      next = new Date(minDateTime);
    }

    onChange(formatDateTimeLocal(next));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between">
          <span className="truncate text-left text-sm">
            {value ? format(new Date(value), "PP p") : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setDisplayMonth((prev) => addDays(startOfMonth(prev), -1))}
            >
              <span className="text-base">&#8249;</span>
            </Button>
            <p className="text-sm font-medium">{format(displayMonth, "MMMM yyyy")}</p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setDisplayMonth((prev) => addDays(endOfMonth(prev), 1))}
            >
              <span className="text-base">&#8250;</span>
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((day) => (
              <p key={day} className="text-center text-xs font-medium text-muted-foreground">
                {day}
              </p>
            ))}

            {monthDays.map((day) => {
              const disabled = isDisabledDay(day);
              const selected = selectedDay ? isSameDay(day, selectedDay) : false;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelectedDay(startOfDay(day))}
                  className={cn(
                    "h-8 rounded-md text-xs transition-colors",
                    !isSameMonth(day, displayMonth) && "text-muted-foreground/50",
                    disabled && "cursor-not-allowed bg-muted text-muted-foreground/50",
                    !disabled && "hover:bg-accent",
                    selected && !disabled && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Hour</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {padTwo(index)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Minute</Label>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }).map((_, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {padTwo(index)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1">
            <Button type="button" size="sm" variant="outline" onClick={() => handleQuickAction("now")}>Now</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleQuickAction("plus30")}>+30m</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleQuickAction("plus60")}>+1h</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => handleQuickAction("eod")}>End day</Button>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Business presets</p>
            <div className="grid grid-cols-3 gap-1">
              <Button type="button" size="sm" variant="outline" onClick={() => applyBusinessPreset(9, 0)}>
                09:00
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyBusinessPreset(13, 30)}>
                13:30
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => applyBusinessPreset(17, 30)}>
                17:30
              </Button>
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={() => selectedDay && applyDateTime(selectedDay)}
            disabled={!selectedDay}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

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
  const [priority, setPriority] = useState<TaskPriority | "none">("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sprintSelection, setSprintSelection] = useState<string>("NONE");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [duePickerOpen, setDuePickerOpen] = useState(false);

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
      setDuePickerOpen(false);
      setErrors({});
    } else if (open && !task) {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setStartDate("");
      setDueDate("");
      setSprintSelection("NONE");
      setAssigneeIds([]);
      setTagIds([]);
      setDuePickerOpen(false);
      setErrors({});
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

    const nextErrors = validateTaskForm({
      title,
      description,
      startDate,
      dueDate,
      isCreateMode: !isEdit,
    });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix validation errors before submitting.");
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
          <SheetTitle>{isEdit ? "Edit Task" : isSubtask ? "New Subtask" : "New Task"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update task details."
              : isSubtask
                ? "Add a subtask with full details."
                : "Add a new task to this project."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              placeholder="Enter task title"
              maxLength={255}
              required
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Optional description..."
              rows={3}
              className="resize-none"
              maxLength={DESCRIPTION_MAX_LENGTH}
              aria-invalid={!!errors.description}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority | "none")}>
              <SelectTrigger>
                <SelectValue placeholder="No priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((key) => (
                  <SelectItem key={key} value={key}>
                    <span className="inline-flex items-center gap-2">
                      <Flag className={cn("h-3.5 w-3.5", taskPriorityConfig[key].iconClass)} />
                      <span className={taskPriorityConfig[key].className}>{taskPriorityConfig[key].label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DateTimePickerField
                placeholder="Select start"
                value={startDate}
                onChange={(next) => {
                  setStartDate(next);
                  if (dueDate && isAfter(new Date(next), new Date(dueDate))) {
                    setDueDate(next);
                  }
                  if (errors.startDate || errors.dueDate) {
                    setErrors((prev) => ({ ...prev, startDate: undefined, dueDate: undefined }));
                  }
                  setDuePickerOpen(true);
                }}
                isCreateMode={!isEdit}
                defaultTime={DEFAULT_START_TIME}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <DateTimePickerField
                placeholder="Select due"
                value={dueDate}
                onChange={(next) => {
                  setDueDate(next);
                  if (errors.startDate || errors.dueDate) {
                    setErrors((prev) => ({ ...prev, dueDate: undefined, startDate: undefined }));
                  }
                }}
                isCreateMode={!isEdit}
                defaultTime={DEFAULT_END_TIME}
                minDateTime={startDate ? new Date(startDate) : undefined}
                open={duePickerOpen}
                onOpenChange={setDuePickerOpen}
              />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
            </div>
          </div>

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
                      <span className="truncate text-sm">{m.user.fullName ?? m.user.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
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
