import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, ProjectStatus } from "@/types/api";
import { useUpdateProjectMutation } from "../api/projectApi";
import { STATUS_CONFIG } from "./ProjectCard";

const STATUS_OPTIONS: ProjectStatus[] = ["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];

const schema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(255, "Name must not exceed 255 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED", "ON_HOLD"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  workspaceId: number;
}

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  workspaceId,
}: EditProjectModalProps) {
  const [updateProject, { isLoading }] = useUpdateProjectMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open && project) {
      reset({
        name: project.name,
        description: project.description ?? "",
        status: project.status,
        startDate: project.startDate ?? "",
        endDate: project.endDate ?? "",
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await updateProject({
        workspaceId,
        projectId: project.id,
        name: data.name,
        description: data.description || undefined,
        status: data.status,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      }).unwrap();
      toast.success("Project updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update project. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-project-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-project-name"
              placeholder="e.g. Website Redesign"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-project-desc">
              Description{" "}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="edit-project-desc"
              rows={3}
              placeholder="What is this project about?"
              className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Start Date</Label>
              <Input id="edit-start-date" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">End Date</Label>
              <Input id="edit-end-date" type="date" {...register("endDate")} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
