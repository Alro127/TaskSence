import { useState } from "react";
import { Users, Loader2 } from "lucide-react";

import type { TeamTemplate } from "@/types/api";
import { useGetMyTemplatesQuery } from "../api/teamTemplateApi";
import {
  TeamTemplateCard,
  TeamTemplateCardGhost,
  CreateTeamTemplateModal,
  EditTeamTemplateModal,
  DeleteTeamTemplateDialog,
} from "../components";

export function TeamTemplatesPage() {
  const { data, isLoading, isError } = useGetMyTemplatesQuery();
  const templates = data?.data ?? [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamTemplate | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load team templates. Please try refreshing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Templates</h1>
          <p className="text-sm text-muted-foreground">
            Pre-define groups of members to quickly add them to workspaces or
            projects.
          </p>
        </div>
      </div>

      {/* ── Empty State ── */}
      {templates.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/30 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No team templates yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first template to get started.
            </p>
          </div>
          <TeamTemplateCardGhost onClick={() => setIsCreateOpen(true)} />
        </div>
      ) : (
        /* ── Grid ── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TeamTemplateCard
              key={template.id}
              template={template}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
          {/* Ghost card to create new */}
          <TeamTemplateCardGhost onClick={() => setIsCreateOpen(true)} />
        </div>
      )}

      {/* ── Modals ── */}
      <CreateTeamTemplateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <EditTeamTemplateModal
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        template={editTarget}
      />
      <DeleteTeamTemplateDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        template={deleteTarget}
      />
    </div>
  );
}
