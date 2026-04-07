import { useState } from "react";
import { Search, Globe } from "lucide-react";
import { useDebounce } from "use-debounce";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMyWorkspacesQuery, useSearchWorkspacesQuery } from "../api/workspaceApi";
import { WorkspaceExploreCard } from "../components/WorkspaceExploreCard";

function WorkspaceCardSkeleton() {
  return (
    <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-11/12" />
      <Skeleton className="mt-4 h-4 w-2/5" />
      <Skeleton className="mt-4 h-9 w-full rounded-md" />
    </div>
  );
}

export function WorkspaceExplorePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 400);

  const { data: myWorkspacesData } = useGetMyWorkspacesQuery();
  const myWorkspaceIds = new Set(
    (myWorkspacesData?.data?.data ?? []).map((w) => w.id)
  );

  const { data, isLoading, isFetching } = useSearchWorkspacesQuery(
    { name: debouncedQuery, limit: 20 },
    { skip: debouncedQuery.trim().length === 0 }
  );

  const results = (data?.data ?? []).filter(
    (ws) => !myWorkspaceIds.has(ws.id)
  );

  const showLoading =
    debouncedQuery.trim().length > 0 && (isLoading || isFetching);
  const showResults = debouncedQuery.trim().length > 0 && !isLoading && !isFetching;
  const hasResults = results.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#444651] mb-1">Community</p>
        <h1
          className="text-3xl font-bold text-[#1a1c1b]"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
        >
          Discover Workspaces
        </h1>
        <p className="text-sm text-[#444651] mt-1">
          Search for public workspaces and send a join request.
        </p>
      </div>

      {/* ── Search Input ── */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#444651]" />
        <Input
          placeholder="Search workspaces by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {/* ── Empty state (before search) ── */}
      {debouncedQuery.trim().length === 0 && (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)]">
            <Globe className="h-6 w-6 text-[#233a87]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1c1b]">Find public workspaces</p>
            <p className="mt-1 text-xs text-[#444651]">
              Type a workspace name above to discover and join public workspaces.
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {showLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <WorkspaceCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* ── Results ── */}
      {showResults && (
        <>
          <div className="flex items-center gap-2">
            <p className="text-sm text-[#444651]">
              {hasResults
                ? `${results.length} workspace${results.length !== 1 ? "s" : ""} found`
                : `No public workspaces found for "${debouncedQuery}"`}
            </p>
          </div>

          {hasResults && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((workspace) => (
                <WorkspaceExploreCard
                  key={workspace.id}
                  workspace={workspace}
                />
              ))}
            </div>
          )}

          {!hasResults && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-center">
              <p className="text-sm font-semibold text-[#1a1c1b]">No results found</p>
              <p className="text-xs text-[#444651]">
                Try a different search term or check the spelling.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
