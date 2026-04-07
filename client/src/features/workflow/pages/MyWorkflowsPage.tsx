import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Filter, Plus, RefreshCw, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WorkflowDraftResponse, WorkflowStatus } from "@/types/api";

import { useGetMyWorkflowsQuery } from "../api/workflowApi";
import { WorkflowCard } from "../components";

type WorkflowTab = "ALL" | "PUBLIC" | "DRAFT";

const TAB_CONFIG: Array<{ value: WorkflowTab; label: string; apiStatus?: WorkflowStatus }> = [
  { value: "ALL", label: "All Workflows" },
  { value: "PUBLIC", label: "Published", apiStatus: "PUBLIC" },
  { value: "DRAFT", label: "Drafts", apiStatus: "DRAFT" },
];

function WorkflowCardSkeleton() {
  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded" />
      <Skeleton className="mt-2 h-4 w-full rounded" />
      <Skeleton className="mt-1 h-4 w-10/12 rounded" />
      <Skeleton className="mt-5 h-4 w-1/2 rounded" />
      <Skeleton className="mt-4 h-9 w-full rounded-md" />
    </div>
  );
}

export function MyWorkflowsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkflowTab>("ALL");
  const [search, setSearch] = useState("");
  const [aiOnly, setAiOnly] = useState(false);

  const apiStatus = TAB_CONFIG.find((tab) => tab.value === activeTab)?.apiStatus;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetMyWorkflowsQuery({ status: apiStatus, page: 0, size: 120 });

  const workflowItems = data?.data?.data;

  const filteredWorkflows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const workflows = workflowItems ?? [];
    return workflows.filter((workflow) => {
      const byKeyword =
        !keyword ||
        workflow.name.toLowerCase().includes(keyword) ||
        (workflow.description?.toLowerCase().includes(keyword) ?? false);

      const bySource = !aiOnly || workflow.generationSource === "AI_REFINED";
      return byKeyword && bySource;
    });
  }, [workflowItems, search, aiOnly]);

  const hasFilters = search.trim().length > 0 || aiOnly;

  const handleOpenWorkflow = (workflow: WorkflowDraftResponse) => {
    navigate(`/workflows/${workflow.id}`, { state: { workflow } });
  };

  const clearFilters = () => {
    setSearch("");
    setAiOnly(false);
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#444651]">Workflows</p>
          <h1
            className="text-3xl font-bold text-[#1a1c1b]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
          >
            My Workflows
          </h1>
          <p className="mt-1 text-sm text-[#444651]">Manage and publish your workflow templates.</p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative min-w-[220px] flex-1 sm:flex-none sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#444651]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workflows..."
              className="pl-9"
              aria-label="Search workflows"
            />
          </div>
          <Button
            variant="outline"
            className={cn(aiOnly && "border-[rgba(35,58,135,0.2)] bg-[rgba(35,58,135,0.08)] text-[#233a87]")}
            onClick={() => setAiOnly((value) => !value)}
            aria-pressed={aiOnly}
          >
            <Filter className="h-4 w-4" />
            AI refined
          </Button>
          <Button variant="outline" onClick={() => navigate("/community?tab=workflows")}>
            <Compass className="h-4 w-4" />
            Explore public
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex min-w-max items-center gap-2">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.value
                    ? "bg-[#233a87] text-white"
                    : "bg-[#f4f3f1] text-[#444651] hover:bg-[#e9e8e6]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#444651]">
          <p>
            {isFetching && !isLoading ? "Refreshing..." : `${filteredWorkflows.length} workflow${filteredWorkflows.length !== 1 ? "s" : ""}`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-[#233a87] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <WorkflowCardSkeleton key={index} />
          ))}
        </section>
      ) : isError ? (
        <section className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(186,26,26,0.25)] bg-[rgba(186,26,26,0.05)] px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(186,26,26,0.08)]">
            <RefreshCw className="h-6 w-6 text-[#ba1a1a]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1c1b]">Failed to load workflows</p>
            <p className="text-xs text-[#444651]">Please retry or check your connection.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Retry loading
          </Button>
        </section>
      ) : (workflowItems?.length ?? 0) === 0 ? (
        <section className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)]">
            <Sparkles className="h-6 w-6 text-[#233a87]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1c1b]">No workflows yet</p>
            <p className="max-w-sm text-xs text-[#444651]">
              Create your first workflow draft from a project detail page.
            </p>
          </div>
          <Button className="bg-[#233a87] text-white hover:opacity-90" onClick={() => navigate("/workspaces")}>Go to projects</Button>
        </section>
      ) : filteredWorkflows.length === 0 ? (
        <section className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] px-4 text-center">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1c1b]">No matching workflows</p>
            <p className="text-xs text-[#444651]">
              No results for <span className="font-semibold">{search.trim() || "current filters"}</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" onClick={clearFilters}>Clear search</Button>
            <Button className="bg-[#233a87] text-white hover:opacity-90" onClick={() => navigate("/workspaces")}>Create from project</Button>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onOpen={() => handleOpenWorkflow(workflow)}
            />
          ))}

          <button
            type="button"
            onClick={() => navigate("/workspaces")}
            className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-[#444651] transition-all hover:border-[#233a87]/40 hover:bg-[rgba(35,58,135,0.04)] hover:text-[#233a87]"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">Create from project</span>
          </button>
        </section>
      )}

      <button
        type="button"
        onClick={() => navigate("/workspaces")}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#233a87] text-white shadow-[0_6px_20px_rgba(35,58,135,0.35)] transition-transform hover:scale-[1.02] md:hidden"
        aria-label="Create workflow from project"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
