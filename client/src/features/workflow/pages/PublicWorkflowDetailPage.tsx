import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, CopyPlus, Loader2, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/utils";

import {
  useCreateWorkflowDraftFromProjectMutation,
  useGetWorkflowDetailQuery,
  useGetWorkflowRatingSummaryQuery,
  useUpsertWorkflowRatingMutation,
} from "../api/workflowApi";
import { RatingDialog } from "../components";

function deriveEstimatedMinutes(stepCount: number): number {
  const safeCount = Math.max(1, stepCount);
  return safeCount * 12;
}

export function PublicWorkflowDetailPage() {
  const navigate = useNavigate();
  const { workflowId: workflowIdParam } = useParams<{ workflowId: string }>();
  const workflowId = Number(workflowIdParam);

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id ?? null);

  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);

  const {
    data: workflowData,
    isLoading: isWorkflowLoading,
    isError: isWorkflowError,
    refetch: refetchWorkflow,
  } = useGetWorkflowDetailQuery({ workflowId }, { skip: Number.isNaN(workflowId) });
  const workflow = workflowData?.data;

  const {
    data: ratingSummaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetWorkflowRatingSummaryQuery({ workflowId }, { skip: Number.isNaN(workflowId) });
  const ratingSummary = ratingSummaryData?.data;

  const [createWorkflowDraftFromProject, { isLoading: isCloning }] =
    useCreateWorkflowDraftFromProjectMutation();
  const [upsertWorkflowRating, { isLoading: isSubmittingRating }] = useUpsertWorkflowRatingMutation();

  const isOwner = useMemo(() => {
    if (!workflow || !currentUserId) {
      return false;
    }
    return workflow.createdBy === currentUserId;
  }, [currentUserId, workflow]);

  const handleRequireAuth = () => {
    toast.error("Please sign in to continue.");
    navigate("/auth/login");
  };

  const handleCloneDraft = async () => {
    if (!workflow) {
      return;
    }

    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    try {
      const response = await createWorkflowDraftFromProject({ projectId: workflow.projectId }).unwrap();
      toast.success("Draft created successfully.");
      navigate(`/workflows/${response.data.id}`, { state: { workflow: response.data } });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to clone workflow as draft."));
    }
  };

  const handleSubmitRating = async (payload: { stars: number; reviewText?: string }) => {
    if (!workflow) {
      return;
    }

    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    if (isOwner) {
      toast.error("You cannot rate your own workflow.");
      return;
    }

    try {
      await upsertWorkflowRating({ workflowId: workflow.id, body: payload }).unwrap();
      await refetchSummary();
      setIsRatingDialogOpen(false);
      toast.success("Thanks for your feedback!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to submit rating."));
    }
  };

  if (Number.isNaN(workflowId)) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-[#444651]">Invalid workflow id.</p>
        <Button variant="outline" onClick={() => navigate("/explore")}>Back to explore</Button>
      </div>
    );
  }

  if (isWorkflowLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#444651]" />
      </div>
    );
  }

  if (isWorkflowError || !workflow) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(186,26,26,0.08)]">
          <RefreshCw className="h-6 w-6 text-[#ba1a1a]" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#1a1c1b]">Workflow not found</p>
          <p className="text-xs text-[#444651]">This public workflow may be unavailable.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchWorkflow()}>Retry</Button>
          <Button className="bg-[#233a87] text-white hover:opacity-90" onClick={() => navigate("/explore")}>Back to explore</Button>
        </div>
      </div>
    );
  }

  const estimatedMinutes = deriveEstimatedMinutes(workflow.steps.length);

  return (
    <div className="space-y-6">
      <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-[#233a87] hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to explore
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#444651]">Workflow</p>
        <h1 className="text-3xl font-bold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>
          {workflow.name}
        </h1>
        <p className="max-w-3xl text-sm text-[#444651]">{workflow.description?.trim() || "No description provided."}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="space-y-5 lg:col-span-8">
          <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h2 className="text-sm font-semibold text-[#1a1c1b]">Workflow overview</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#444651]">
              <span>{workflow.steps.length} step{workflow.steps.length !== 1 ? "s" : ""}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-4 w-4" />
                ~{estimatedMinutes} min
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#1a1c1b]">Execution sequence</h2>
            {workflow.steps.map((step, index) => (
              <article key={step.id} className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#444651]">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}>
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-[#444651]">{step.description?.trim() || "No details for this step."}</p>
                <p className="mt-3 text-xs text-[#444651]">
                  {step.tasks.length} task{step.tasks.length !== 1 ? "s" : ""}
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4 lg:col-span-4">
          <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h2 className="text-sm font-semibold text-[#1a1c1b]">Community rating</h2>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-2xl font-bold text-[#1a1c1b]">{ratingSummary?.averageStars?.toFixed(1) ?? "N/A"}</p>
              <p className="mb-1 text-xs text-[#444651]">/ 5</p>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#444651]">
              <Star className="h-3.5 w-3.5 fill-[#643300] text-[#643300]" />
              <span>
                {isSummaryLoading
                  ? "Loading summary..."
                  : `${ratingSummary?.totalRatings ?? 0} rating${(ratingSummary?.totalRatings ?? 0) !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="mt-4 grid gap-2">
              <Button
                className="w-full bg-[#233a87] text-white hover:opacity-90"
                disabled={isCloning}
                onClick={() => void handleCloneDraft()}
              >
                {isCloning && <Loader2 className="h-4 w-4 animate-spin" />}
                <CopyPlus className="h-4 w-4" />
                Clone as Draft
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (!isAuthenticated) {
                    handleRequireAuth();
                    return;
                  }
                  setIsRatingDialogOpen(true);
                }}
              >
                Rate this Workflow
              </Button>
              {isOwner && (
                <p className="text-xs text-[#ba1a1a]">You cannot rate your own workflow.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <RatingDialog
        open={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        onSubmit={handleSubmitRating}
        isSubmitting={isSubmittingRating}
        isGuest={!isAuthenticated}
        isOwner={isOwner}
      />
    </div>
  );
}
