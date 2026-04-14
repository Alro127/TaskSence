import { useState } from "react";
import { Heart, Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useExploreWorkflowsQuery } from "../api/workflowApi";
import { PublicWorkflowCard } from "../components";

function PublicWorkflowCardSkeleton() {
  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-10/12" />
      <Skeleton className="mt-4 h-4 w-1/2" />
      <Skeleton className="mt-3 h-4 w-2/5" />
      <Skeleton className="mt-4 h-9 w-full rounded-md" />
    </div>
  );
}

export function ExplorePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 380);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useExploreWorkflowsQuery({ keyword: debouncedQuery, page: 0, size: 24 });

  const workflows = data?.data?.data ?? [];
  const hasKeyword = debouncedQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#444651]">Community</p>
        <h1 className="text-3xl font-bold text-[#1a1c1b]" style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}>
          Explore Workflows
        </h1>
        <p className="text-sm text-[#444651]">
          Discover public workflows shared by the community and adapt them for your own projects.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#444651]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by workflow title or keyword..."
            className="pl-9"
            aria-label="Search public workflows"
          />
        </div>
        <Button variant="outline" onClick={() => navigate("/workflows?tab=favorites")}>
          <Heart className="h-4 w-4" />
          My favorites
        </Button>
      </div>

      {isLoading || isFetching ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <PublicWorkflowCardSkeleton key={index} />
          ))}
        </section>
      ) : isError ? (
        <section className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(186,26,26,0.25)] bg-[rgba(186,26,26,0.05)] px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(186,26,26,0.08)]">
            <RefreshCw className="h-6 w-6 text-[#ba1a1a]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1c1b]">Unable to load public workflows</p>
            <p className="text-xs text-[#444651]">Please try again in a moment.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <Loader2 className="h-4 w-4" />
            Retry
          </Button>
        </section>
      ) : workflows.length === 0 && hasKeyword ? (
        <section className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] px-4 text-center">
          <p className="text-sm font-semibold text-[#1a1c1b]">No results found</p>
          <p className="text-xs text-[#444651]">
            No workflows matched <span className="font-semibold">&quot;{debouncedQuery.trim()}&quot;</span>.
          </p>
        </section>
      ) : workflows.length === 0 ? (
        <section className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)]">
            <Sparkles className="h-6 w-6 text-[#233a87]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1a1c1b]">No public workflows yet</p>
            <p className="text-xs text-[#444651]">Published workflows will appear here once shared.</p>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <PublicWorkflowCard
              key={workflow.id}
              workflow={workflow}
              onOpen={(workflowId) => navigate(`/explore/${workflowId}`)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
