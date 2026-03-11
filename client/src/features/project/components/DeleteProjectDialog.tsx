import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@/types/api";
import { useDeleteProjectMutation } from "../api/projectApi";

interface DeleteProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successful deletion. If not provided, navigates back to workspace. */
  onSuccess?: () => void;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProjectDialogProps) {
  const navigate = useNavigate();
  const [deleteProject, { isLoading }] = useDeleteProjectMutation();
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === project.name;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    try {
      await deleteProject({
        workspaceId: project.workspaceId,
        projectId: project.id,
      }).unwrap();
      toast.success("Project deleted", {
        description: `"${project.name}" has been permanently deleted.`,
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/workspaces/${project.workspaceId}`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete project"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setConfirmText("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            Delete project
          </DialogTitle>
          <DialogDescription>
            This action <strong>cannot be undone</strong>. All tasks and data
            within{" "}
            <strong className="text-foreground">"{project.name}"</strong>{" "}
            will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Deleting this project will permanently remove all its tasks and
            member associations.
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type{" "}
              <strong className="font-semibold text-foreground">
                {project.name}
              </strong>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              placeholder={project.name}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isConfirmed || isLoading}
            onClick={handleDelete}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
