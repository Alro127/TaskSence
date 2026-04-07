import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExplorePage } from "@/features/workflow/pages";
import { WorkspaceExplorePage } from "@/features/workspace/pages";

type CommunityTab = "workspaces" | "workflows";

const DEFAULT_TAB: CommunityTab = "workspaces";

function resolveTab(tab: string | null): CommunityTab {
  return tab === "workflows" ? "workflows" : DEFAULT_TAB;
}

export function CommunityPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => resolveTab(searchParams.get("tab")), [searchParams]);

  const handleTabChange = (value: string) => {
    const nextTab = resolveTab(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList aria-label="Community explore categories">
        <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
        <TabsTrigger value="workflows">Workflows</TabsTrigger>
      </TabsList>

      <TabsContent value="workspaces" className="mt-0">
        <WorkspaceExplorePage />
      </TabsContent>

      <TabsContent value="workflows" className="mt-0">
        <ExplorePage />
      </TabsContent>
    </Tabs>
  );
}
