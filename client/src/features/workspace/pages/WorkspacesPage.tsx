import { useState } from "react";
import { Plus, FolderKanban, Loader2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/types/api";
import {
  togglePin,
  addRecent,
  removeFromPinnedAndRecent,
} from "../workspaceSlice";
import { useGetMyWorkspacesQuery } from "../api/workspaceApi";
import {
  WorkspaceCard,
  WorkspaceCardGhost,
  CreateWorkspaceModal,
  EditWorkspaceModal,
  DeleteWorkspaceDialog,
} from "../components";

export function WorkspacesPage() {
  const dispatch = useAppDispatch();
  const pinnedIds = useAppSelector((s) => s.workspace.pinnedIds);
  const recentIds = useAppSelector((s) => s.workspace.recentIds);

  const currentUserId = useAppSelector((s) => s.user.currentUser?.id);

  const { data, isLoading, isError } = useGetMyWorkspacesQuery();
  const workspaces = data?.data?.data ?? [];

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);

  // Derived lists
  const pinnedWorkspaces = pinnedIds
    .map((id) => workspaces.find((w) => w.id === id))
    .filter(Boolean) as Workspace[];

  const recentWorkspaces = recentIds
    .filter((id) => !pinnedIds.includes(id))
    .map((id) => workspaces.find((w) => w.id === id))
    .filter(Boolean) as Workspace[];

  const otherWorkspaces = workspaces.filter(
    (w) => !pinnedIds.includes(w.id) && !recentIds.includes(w.id),
  );

  const handleTogglePin = (id: number) => {
    dispatch(togglePin(id));
  };

  const handleCardClick = (id: number) => {
    dispatch(addRecent(id));
  };

  const handleDeleteSuccess = (id: number) => {
    dispatch(removeFromPinnedAndRecent(id));
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load workspaces. Please try refreshing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Organize your projects and team members.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* ── Empty State ── */}
      {workspaces.length === 0 && (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/30 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FolderKanban className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No workspaces yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create your first workspace to start organizing projects.
            </p>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create workspace
          </Button>
        </div>
      )}

      {/* ── Pinned Section ── */}
      {pinnedWorkspaces.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Pinned
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {pinnedWorkspaces.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedWorkspaces.map((ws) => (
              <div key={ws.id} onClick={() => handleCardClick(ws.id)}>
                <WorkspaceCard
                  workspace={ws}
                  isPinned={true}
                  onTogglePin={handleTogglePin}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  variant="pinned"
                  canManage={ws.ownerId === currentUserId}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Section ── */}
      {recentWorkspaces.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Recent
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {recentWorkspaces.length}
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentWorkspaces.map((ws) => (
              <div key={ws.id} onClick={() => handleCardClick(ws.id)}>
                <WorkspaceCard
                  workspace={ws}
                  isPinned={false}
                  onTogglePin={handleTogglePin}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  canManage={ws.ownerId === currentUserId}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── All Workspaces Section ── */}
      {workspaces.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {pinnedWorkspaces.length > 0 || recentWorkspaces.length > 0
              ? "All workspaces"
              : "Your workspaces"}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {workspaces.length}
            </span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherWorkspaces.map((ws) => (
              <div key={ws.id} onClick={() => handleCardClick(ws.id)}>
                <WorkspaceCard
                  workspace={ws}
                  isPinned={pinnedIds.includes(ws.id)}
                  onTogglePin={handleTogglePin}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  canManage={ws.ownerId === currentUserId}
                />
              </div>
            ))}

            {/* Ghost card — quick create at bottom of grid */}
            <WorkspaceCardGhost onClick={() => setIsCreateOpen(true)} />
          </div>
        </section>
      )}

      {/* ── Modals ── */}
      <CreateWorkspaceModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <EditWorkspaceModal
        workspace={editTarget}
        open={editTarget !== null}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
      />

      <DeleteWorkspaceDialog
        workspace={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        onSuccess={() => {
          if (deleteTarget) handleDeleteSuccess(deleteTarget.id);
        }}
      />
    </div>
  );
}
