import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { GitBranch, Heart, Loader2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { WorkflowDraftResponse } from "@/types/api";

import {
  useGetWorkflowRatingSummaryQuery,
  useToggleWorkflowFavoriteMutation,
} from "../api/workflowApi";

interface PublicWorkflowCardProps {
  workflow: WorkflowDraftResponse;
  onOpen: (workflowId: number) => void;
}

export function PublicWorkflowCard({ workflow, onOpen }: PublicWorkflowCardProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [toggleWorkflowFavorite, { isLoading: isTogglingFavorite }] = useToggleWorkflowFavoriteMutation();
  const [localFavorited, setLocalFavorited] = useState<boolean | null>(null);

  const { data: ratingSummaryData } = useGetWorkflowRatingSummaryQuery({ workflowId: workflow.id });
  const ratingSummary = ratingSummaryData?.data;

  const effectiveFavorite = localFavorited ?? false;

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to favorite workflows.");
      navigate("/auth/login");
      return;
    }

    try {
      const response = await toggleWorkflowFavorite({ workflowId: workflow.id }).unwrap();
      setLocalFavorited(response.data.favorited);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update favorite."));
    }
  };

  return (
    <article className="ghost-border flex h-full flex-col rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:translate-y-[-1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.09)] focus-within:ring-2 focus-within:ring-[#006a61]/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(35,58,135,0.08)]">
          <GitBranch className="h-5 w-5 text-[#233a87]" />
        </div>
        <button
          type="button"
          onClick={() => void handleToggleFavorite()}
          className="rounded-md p-1.5 text-[#444651] transition-colors hover:bg-[rgba(35,58,135,0.08)] hover:text-[#233a87] focus-visible:ring-2 focus-visible:ring-[#006a61]"
          aria-label={effectiveFavorite ? "Remove from favorites" : "Add to favorites"}
          disabled={isTogglingFavorite}
        >
          {isTogglingFavorite ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", effectiveFavorite && "fill-[#ba1a1a] text-[#ba1a1a]")} />
          )}
        </button>
      </div>

      <h3 className="line-clamp-2 text-sm font-semibold text-[#1a1c1b]">{workflow.name}</h3>

      <p className="line-clamp-3 text-sm text-[#444651]">
        {workflow.description?.trim() || "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#444651]">
        <span>{workflow.steps.length} step{workflow.steps.length !== 1 ? "s" : ""}</span>
        <span>•</span>
        <span>Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-[#444651]">
        <Star className="h-3.5 w-3.5 fill-[#643300] text-[#643300]" />
        <span>
          {ratingSummary?.averageStars?.toFixed(1) ?? "N/A"}
        </span>
        <span>({ratingSummary?.totalRatings ?? 0} rating{(ratingSummary?.totalRatings ?? 0) !== 1 ? "s" : ""})</span>
      </div>

      <Button className="mt-4 w-full bg-[#233a87] text-white hover:opacity-90" onClick={() => onOpen(workflow.id)}>
        View workflow
      </Button>
    </article>
  );
}
