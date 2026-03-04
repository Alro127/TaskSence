import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteProject({
        workspaceId: project.workspaceId,
        projectId: project.id,
      }).unwrap();
      toast.success(`"${project.name}" has been deleted.`);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/workspaces/${project.workspaceId}`);
      }
    } catch {
      toast.error("Failed to delete project. Please try again.");
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setConfirmed(false);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            Delete Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{project.name}</span>?
            This action cannot be undone and all associated data (tasks, members)
            will be permanently removed.
          </p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-destructive"
            />
            <span className="text-sm">
              I understand this action is irreversible
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!confirmed || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
