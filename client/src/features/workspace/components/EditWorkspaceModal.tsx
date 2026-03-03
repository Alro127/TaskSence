import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Workspace } from "@/types/api";
import { useUpdateWorkspaceMutation } from "../api/workspaceApi";

const schema = z.object({
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

type FormData = z.infer<typeof schema>;

interface EditWorkspaceModalProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWorkspaceModal({
  workspace,
  open,
  onOpenChange,
}: EditWorkspaceModalProps) {
  const [updateWorkspace, { isLoading }] = useUpdateWorkspaceMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Pre-fill form when workspace changes
  useEffect(() => {
    if (workspace) {
      reset({
        name: workspace.name,
        description: workspace.description ?? "",
        isPublic: workspace.isPublic ?? false,
      });
    }
  }, [workspace, reset]);

  const onSubmit = async (data: FormData) => {
    if (!workspace) return;
    try {
      await updateWorkspace({
        id: workspace.id,
        name: data.name,
        description: data.description || undefined,
        isPublic: data.isPublic,
      }).unwrap();
      toast.success("Workspace updated!", {
        description: `"${data.name}" has been updated.`,
      });
      onOpenChange(false);
    } catch {
      toast.error("Failed to update workspace", {
        description: "Please try again.",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && workspace) {
          reset({ name: workspace.name, description: workspace.description ?? "", isPublic: workspace.isPublic ?? false });
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit workspace</DialogTitle>
          <DialogDescription>
            Update the name or description of this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="edit-ws-name">Workspace name</Label>
            <Input
              id="edit-ws-name"
              placeholder="e.g. Product Team"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ws-desc">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <textarea
              id="edit-ws-desc"
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
              id="edit-ws-public"
              className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...register("isPublic")}
            />
            <Label htmlFor="edit-ws-public" className="cursor-pointer font-normal">
              Make this workspace public
              <span className="ml-1 text-xs text-muted-foreground">
                (Anyone can view it)
              </span>
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
