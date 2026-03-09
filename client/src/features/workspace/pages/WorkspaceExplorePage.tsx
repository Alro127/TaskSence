import { useState } from "react";
import { Search, Globe, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";

import { Input } from "@/components/ui/input";
import { useGetMyWorkspacesQuery, useSearchWorkspacesQuery } from "../api/workspaceApi";
import { WorkspaceExploreCard } from "../components/WorkspaceExploreCard";

export function WorkspaceExplorePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 400);

  const { data: myWorkspacesData } = useGetMyWorkspacesQuery();
  const myWorkspaceIds = new Set(
    (myWorkspacesData?.data ?? []).map((w) => w.id)
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
        <h1 className="text-2xl font-bold tracking-tight">
          Discover Workspaces
        </h1>
        <p className="text-sm text-muted-foreground">
          Search for public workspaces and send a join request.
        </p>
      </div>

      {/* ── Search Input ── */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/30 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Globe className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Find public workspaces</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Type a workspace name above to discover and join public workspaces.
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {showLoading && (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Results ── */}
      {showResults && (
        <>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
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
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 text-center">
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs text-muted-foreground">
                Try a different search term or check the spelling.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
