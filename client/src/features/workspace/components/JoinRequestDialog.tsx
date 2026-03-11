import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Workspace, WorkspaceJoinRequest } from "@/types/api";
import { useCreateJoinRequestMutation } from "../api/workspaceJoinRequestApi";

interface JoinRequestDialogProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (request: WorkspaceJoinRequest) => void;
}

export function JoinRequestDialog({
  workspace,
  open,
  onOpenChange,
  onSuccess,
}: JoinRequestDialogProps) {
  const [message, setMessage] = useState("");
  const [createJoinRequest, { isLoading }] = useCreateJoinRequestMutation();

  const handleSubmit = async () => {
    try {
      const result = await createJoinRequest({
        workspaceId: workspace.id,
        body: { message: message.trim() || undefined },
      }).unwrap();
      toast.success("Join request sent!", {
        description: `Your request to join "${workspace.name}" has been sent.`,
      });
      onSuccess?.(result.data);
      setMessage("");
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send join request"));
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!isLoading) {
      if (!val) setMessage("");
      onOpenChange(val);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request to join workspace</DialogTitle>
          <DialogDescription>
            Send a request to join{" "}
            <span className="font-medium text-foreground">{workspace.name}</span>
            . The workspace owner or manager will review your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="join-message">
            Introduce yourself{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <textarea
            id="join-message"
            rows={3}
            placeholder="Tell the workspace owner why you'd like to join..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
          />
          <p className="text-right text-xs text-muted-foreground">
            {message.length}/500
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
