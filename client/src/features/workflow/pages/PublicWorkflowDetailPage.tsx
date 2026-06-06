import { formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";

import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/utils";

import {
  useGetWorkflowDetailQuery,
  useGetWorkflowRatingSummaryQuery,
  useUpsertWorkflowRatingMutation,
  useGenerateGuidanceMutation,
  useGetGuidanceByWorkflowQuery,
  useCreateProjectFromWorkflowMutation,
} from "../api/workflowApi";
import { PublicWorkflowReviewsTab, PublicWorkflowStepsTab, RatingDialog, RegenerateGuidanceDialog } from "../components";
import { Sparkles, LayoutPanelTop, CheckCircle2 } from "lucide-react";

function deriveEstimatedMinutes(stepCount: number): number {
  const safeCount = Math.max(1, stepCount);
  return safeCount * 12;
}

type DetailTab = "steps" | "reviews";

export function PublicWorkflowDetailPage() {
  const navigate = useNavigate();
  const { workflowId: workflowIdParam } = useParams<{ workflowId: string }>();
  const workflowId = Number(workflowIdParam);

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUserId = useAppSelector((state) => state.user.currentUser?.id ?? null);

  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("steps");

  const {
    data: workflowData,
    isLoading: isWorkflowLoading,
    isError: isWorkflowError,
    refetch: refetchWorkflow,
  } = useGetWorkflowDetailQuery({ workflowId }, { skip: Number.isNaN(workflowId) });
  const workflow = workflowData?.data;

  const { data: guidanceData, isLoading: isGuidanceLoading } = useGetGuidanceByWorkflowQuery(
    { workflowId },
    { skip: Number.isNaN(workflowId) }
  );
  const guidance = guidanceData?.data;

  const {
    data: ratingSummaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetWorkflowRatingSummaryQuery({ workflowId }, { skip: Number.isNaN(workflowId) });
  const ratingSummary = ratingSummaryData?.data;

  const [upsertWorkflowRating, { isLoading: isSubmittingRating }] = useUpsertWorkflowRatingMutation();
  const [generateGuidance, { isLoading: isGeneratingGuidance }] = useGenerateGuidanceMutation();
  const [createProjectFromWorkflow, { isLoading: isCreatingProject }] = useCreateProjectFromWorkflowMutation();

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

  const handleGenerateGuidance = () => {
    setIsGuidanceDialogOpen(true);
  };

  const handleConfirmRegenerate = async (userInstructions: string) => {
    if (!workflow) {
      return;
    }

    try {
      await generateGuidance({
        workflowId: workflow.id,
        body: userInstructions.trim() ? { userInstructions } : undefined,
      }).unwrap();
      toast.success("AI Guidance generated successfully");
      setIsGuidanceDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to generate guidance."));
    }
  };

  const handleCreateProject = async () => {
    if (!workflow) return;
    if (!isAuthenticated) {
      handleRequireAuth();
      return;
    }

    try {
      const response = await createProjectFromWorkflow({
        workflowId: workflow.id,
        body: {
          name: `${workflow.name} Project`,
          description: workflow.description || undefined,
        }
      }).unwrap();
      toast.success("Project created successfully from template!");
      // Navigate to the new project detail page
      navigate(`/workspaces/${response.data.workspaceId}/projects/${response.data.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create project from template."));
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
  const ratingValue = ratingSummary?.averageStars?.toFixed(1) ?? "N/A";
  const ratingCount = ratingSummary?.totalRatings ?? 0;
  const ratingCountText = `${ratingCount} rating${ratingCount !== 1 ? "s" : ""}`;
  const lastUpdatedText = formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true });

  const activeStepIndex = workflow.steps.findIndex((step) =>
    step.tasks.some((task) => task.status === "IN_PROGRESS" || task.status === "REVIEW"),
  );

  const fallbackStepIndex = workflow.steps.findIndex((step) =>
    step.tasks.some((task) => task.status === "TODO"),
  );

  const currentStepIndex =
    activeStepIndex >= 0 ? activeStepIndex : fallbackStepIndex >= 0 ? fallbackStepIndex : workflow.steps.length > 0 ? 0 : -1;

  const progressPercent =
    workflow.steps.length > 0 && currentStepIndex >= 0
      ? Math.max(Math.round(((currentStepIndex + 1) / workflow.steps.length) * 100), 1)
      : 0;

  return (
    <div className="space-y-8">
      <Link to="/explore" className="inline-flex items-center gap-2 text-sm font-medium text-[#444651] hover:text-[#233a87]">
        <ArrowLeft className="h-4 w-4" />
        Back to explore
      </Link>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="space-y-6 xl:col-span-8">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1
                className="text-3xl font-bold text-[#1a1c1b] md:text-5xl"
                style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
              >
                {workflow.name}
              </h1>
              <span className="inline-flex items-center rounded-full border border-[rgba(0,106,97,0.2)] bg-[rgba(0,106,97,0.08)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#006a61]">
                {workflow.status === "PUBLIC" ? "Peer reviewed" : "Draft"}
              </span>
            </div>
            <p className="max-w-3xl text-sm text-[#444651] md:text-base">
              {workflow.description?.trim() || "No description provided."}
            </p>
          </header>

          <div className="border-b border-[#efeeec]">
            <div className="flex gap-6 overflow-x-auto">
              <button
                type="button"
                className={`pb-4 text-sm font-semibold transition-all ${
                  activeTab === "steps"
                    ? "border-b-2 border-[#233a87] text-[#233a87]"
                    : "border-b-2 border-transparent text-[#444651] hover:text-[#1a1c1b]"
                }`}
                onClick={() => setActiveTab("steps")}
              >
                Steps
              </button>
              <button
                type="button"
                className={`pb-4 text-sm font-semibold transition-all ${
                  activeTab === "reviews"
                    ? "border-b-2 border-[#233a87] text-[#233a87]"
                    : "border-b-2 border-transparent text-[#444651] hover:text-[#1a1c1b]"
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                Reviews &amp; Comments
              </button>
            </div>
          </div>

          {activeTab === "steps" ? (
            <PublicWorkflowStepsTab
              steps={workflow.steps}
              estimatedMinutes={estimatedMinutes}
              progressPercent={progressPercent}
              activeStepIndex={currentStepIndex}
              guidance={guidance}
            />
          ) : (
            <PublicWorkflowReviewsTab workflowId={workflow.id} />
          )}
        </section>

        <aside className="space-y-4 xl:col-span-4">
          <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#444651]">Your progress</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-full bg-[conic-gradient(#233a87_var(--progress),#e9e8e6_0)] [--progress:25%]">
                <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-white text-xs font-bold text-[#233a87]">
                  {progressPercent}%
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a1c1b]">Step {Math.max(currentStepIndex + 1, 1)} in progress</p>
                <p className="text-xs text-[#444651]">Estimated {estimatedMinutes}m total</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-[#1a1c1b]">
              <Star className="h-4 w-4 fill-[#643300] text-[#643300]" />
              <span className="font-bold">{isSummaryLoading ? "..." : ratingValue}</span>
              <span className="text-xs text-[#444651]">({ratingCountText})</span>
            </div>

            <div className="mt-5 space-y-2">
              <Button
                className="w-full bg-[#006a61] text-white hover:opacity-90"
                disabled={isCreatingProject}
                onClick={() => void handleCreateProject()}
              >
                {isCreatingProject && <Loader2 className="h-4 w-4 animate-spin" />}
                <LayoutPanelTop className="h-4 w-4" />
                Use this Template
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
              {isOwner && <p className="text-xs text-[#ba1a1a]">You cannot rate your own workflow.</p>}
            </div>
          </div>

          {workflow.status === "PUBLIC" && (
            <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#444651]">AI Guidance</h2>
                {guidance ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#006a61]">
                    <CheckCircle2 className="h-3 w-3" /> READY
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#ba1a1a]">NONE</span>
                )}
              </div>
              
              <p className="mt-2 text-xs text-[#444651]">
                {guidance 
                  ? "This template includes interactive AI-powered onboarding guidance."
                  : "No AI guidance generated yet for this template."}
              </p>

              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full gap-2 border-[#233a87] text-[#233a87] hover:bg-[rgba(35,58,135,0.04)]"
                  disabled={isGeneratingGuidance || isGuidanceLoading}
                  onClick={() => void handleGenerateGuidance()}
                >
                  {isGeneratingGuidance ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {guidance ? "Regenerate Guidance" : "Generate Guidance"}
                </Button>
              )}
            </div>
          )}

          <div className="rounded-xl bg-[#f4f3f1] p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#444651]">Workflow metadata</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#444651]">Status</span>
                <span className="font-semibold text-[#1a1c1b]">{workflow.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#444651]">Source</span>
                <span className="font-semibold text-[#1a1c1b]">
                  {workflow.generationSource === "AI_REFINED" ? "AI refined" : "Rule based"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#444651]">Updated</span>
                <span className="font-semibold text-[#1a1c1b]">{lastUpdatedText}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#444651]">Published</span>
                <span className="font-semibold text-[#1a1c1b]">
                  {workflow.publishedAt ? formatDistanceToNow(new Date(workflow.publishedAt), { addSuffix: true }) : "Not yet"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[rgba(35,58,135,0.04)] p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#444651]">Quick stats</h3>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-white p-3">
                <p className="text-[10px] uppercase tracking-widest text-[#444651]">Steps</p>
                <p className="text-lg font-bold text-[#1a1c1b]">{workflow.steps.length}</p>
              </div>
              <div className="rounded-md bg-white p-3">
                <p className="text-[10px] uppercase tracking-widest text-[#444651]">Tasks</p>
                <p className="text-lg font-bold text-[#1a1c1b]">
                  {workflow.steps.reduce((total, step) => total + step.tasks.length, 0)}
                </p>
              </div>
              <div className="rounded-md bg-white p-3">
                <p className="text-[10px] uppercase tracking-widest text-[#444651]">Rating</p>
                <p className="text-lg font-bold text-[#1a1c1b]">{ratingValue}</p>
              </div>
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

      <RegenerateGuidanceDialog
        open={isGuidanceDialogOpen}
        onOpenChange={setIsGuidanceDialogOpen}
        onConfirm={handleConfirmRegenerate}
        isLoading={isGeneratingGuidance}
        isRegenerating={!!guidance}
      />
    </div>
  );
}
