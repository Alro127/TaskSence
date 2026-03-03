import { useState } from "react";
import { toast } from "sonner";
import { Loader2, TriangleAlert } from "lucide-react";

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
import { useDeleteWorkspaceMutation } from "../api/workspaceApi";

interface DeleteWorkspaceDialogProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
  onSuccess,
}: DeleteWorkspaceDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [deleteWorkspace, { isLoading }] = useDeleteWorkspaceMutation();

  const isConfirmed = confirmText === workspace?.name;

  const handleDelete = async () => {
    if (!workspace || !isConfirmed) return;
    try {
      await deleteWorkspace(workspace.id).unwrap();
      toast.success("Workspace deleted", {
        description: `"${workspace.name}" has been permanently deleted.`,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete workspace", {
        description: "Please try again.",
      });
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
            Delete workspace
          </DialogTitle>
          <DialogDescription>
            This action <strong>cannot be undone</strong>. All projects and data
            within{" "}
            <strong className="text-foreground">"{workspace?.name}"</strong>{" "}
            will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Deleting this workspace will permanently remove all its projects,
            tasks, and member associations.
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type{" "}
              <strong className="font-semibold text-foreground">
                {workspace?.name}
              </strong>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              placeholder={workspace?.name ?? ""}
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
            Delete workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
