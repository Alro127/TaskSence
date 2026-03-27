import { useState } from "react";
import { Users, Loader2 } from "lucide-react";

import type { TeamTemplate } from "@/types/api";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useGetMyTemplatesQuery } from "../api/teamTemplateApi";
import {
  TeamTemplateCard,
  TeamTemplateCardGhost,
  CreateTeamTemplateModal,
  EditTeamTemplateModal,
  DeleteTeamTemplateDialog,
} from "../components";

const PAGE_SIZE = 9;

export function TeamTemplatesPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useGetMyTemplatesQuery({ page, size: PAGE_SIZE });
  const templates = data?.data?.data ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

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
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#444651] mb-1">Collaboration</p>
        <h1
          className="text-3xl font-bold text-[#1a1c1b]"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
        >
          Team Templates
        </h1>
        <p className="text-sm text-[#444651] mt-1">
          Pre-define groups of members to quickly add them to workspaces or projects.
        </p>
      </div>

      {/* ── Empty State ── */}
      {templates.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)]">
            <Users className="h-6 w-6 text-[#233a87]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1c1b]">No team templates yet</p>
            <p className="mt-1 text-xs text-[#444651]">
              Create your first template to get started.
            </p>
          </div>
          <TeamTemplateCardGhost onClick={() => setIsCreateOpen(true)} />
        </div>
      ) : (
        <>
        {/* ── Grid ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TeamTemplateCard
              key={template.id}
              template={template}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
          {/* Ghost card to create new — only on last page */}
          {page === totalPages - 1 && (
            <TeamTemplateCardGhost onClick={() => setIsCreateOpen(true)} />
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  aria-disabled={page === 0}
                  className={page === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => {
                const showPage =
                  i === 0 ||
                  i === totalPages - 1 ||
                  Math.abs(i - page) <= 1;
                if (!showPage) {
                  if (i === 1 || i === totalPages - 2) {
                    return (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={i === page}
                      onClick={() => setPage(i)}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  aria-disabled={page === totalPages - 1}
                  className={page === totalPages - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        </>
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
