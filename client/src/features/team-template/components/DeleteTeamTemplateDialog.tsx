import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TeamTemplate } from "@/types/api";
import { useDeleteTemplateMutation } from "../api/teamTemplateApi";

interface DeleteTeamTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TeamTemplate | null;
  /** When true, navigates back to /team-templates after delete (use on detail page) */
  navigateAfterDelete?: boolean;
}

export function DeleteTeamTemplateDialog({
  open,
  onOpenChange,
  template,
  navigateAfterDelete = false,
}: DeleteTeamTemplateDialogProps) {
  const navigate = useNavigate();
  const [deleteTemplate, { isLoading }] = useDeleteTemplateMutation();
  const [confirmInput, setConfirmInput] = useState("");

  const isConfirmed =
    template !== null && confirmInput === template.name;

  const handleDelete = async () => {
    if (!template || !isConfirmed) return;
    try {
      await deleteTemplate(template.id).unwrap();
      toast.success(`"${template.name}" deleted successfully.`);
      onOpenChange(false);
      setConfirmInput("");
      if (navigateAfterDelete) navigate("/team-templates");
    } catch {
      toast.error("Failed to delete template. Please try again.");
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setConfirmInput("");
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Team Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. All members in this template will be
            removed.
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type{" "}
              <span className="font-semibold text-foreground">
                {template?.name}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={template?.name ?? ""}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isConfirmed || isLoading}
            onClick={handleDelete}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Template"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
