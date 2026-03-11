import { useState } from "react";
import { FolderKanban, Globe, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getApiErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Workspace, WorkspaceJoinRequest } from "@/types/api";
import { useCancelJoinRequestMutation } from "../api/workspaceJoinRequestApi";
import { JoinRequestDialog } from "./JoinRequestDialog";

interface WorkspaceExploreCardProps {
  workspace: Workspace;
  /** Existing join request from the current user, if any */
  existingRequest?: WorkspaceJoinRequest | null;
}

export function WorkspaceExploreCard({
  workspace,
  existingRequest = null,
}: WorkspaceExploreCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Local state tracks the join request after it's sent (or cleared after cancel)
  const [localRequest, setLocalRequest] = useState<WorkspaceJoinRequest | null>(
    existingRequest
  );

  const [cancelJoinRequest, { isLoading: isCancelling }] =
    useCancelJoinRequestMutation();

  const handleCancel = async () => {
    if (!localRequest) return;
    try {
      await cancelJoinRequest({
        requestId: localRequest.id,
        workspaceId: workspace.id,
      }).unwrap();
      toast.success("Join request cancelled");
      setLocalRequest(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to cancel request"));
    }
  };

  const renderAction = () => {
    if (!localRequest) {
      return (
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          Request to join
        </Button>
      );
    }

    if (localRequest.status === "PENDING") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isCancelling}
          className="gap-1.5 text-muted-foreground"
        >
          {isCancelling ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Cancel request
        </Button>
      );
    }

    if (localRequest.status === "APPROVED") {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          Approved
        </Badge>
      );
    }

    if (localRequest.status === "REJECTED") {
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          Rejected
        </Badge>
      );
    }

    return (
      <Button size="sm" onClick={() => setIsDialogOpen(true)}>
        Request to join
      </Button>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{workspace.name}</p>
              <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
            </div>
            {workspace.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {workspace.description}
              </p>
            ) : (
              <p className="mt-0.5 text-xs italic text-muted-foreground">
                No description
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Created{" "}
            {formatDistanceToNow(new Date(workspace.createdAt), {
              addSuffix: true,
            })}
          </p>
          {renderAction()}
        </div>
      </div>

      <JoinRequestDialog
        workspace={workspace}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={(req) => setLocalRequest(req)}
      />
    </>
  );
}
