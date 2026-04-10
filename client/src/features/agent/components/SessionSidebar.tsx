import { MessageSquare, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AISession } from "@/types/api";

interface SessionSidebarProps {
  sessions: AISession[];
  selectedSessionId: number | null;
  isSessionsLoading: boolean;
  isInitSessionLoading: boolean;
  isDeleteSessionLoading: boolean;
  onCreateSession: () => void;
  onSelectSession: (sessionId: number) => void;
  onDeleteSession: (sessionId: number) => void;
}

export function SessionSidebar({
  sessions,
  selectedSessionId,
  isSessionsLoading,
  isInitSessionLoading,
  isDeleteSessionLoading,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
}: SessionSidebarProps) {
  return (
    <aside className="flex h-full flex-col rounded-xl border border-[rgba(197,197,211,0.3)] bg-white p-3">
      <button
        onClick={onCreateSession}
        disabled={isInitSessionLoading}
        className="mb-3 inline-flex items-center justify-center gap-2 rounded-lg bg-[#233a87] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2d6b] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        New Session
      </button>

      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#444651]">
          Sessions
        </p>
        <span className="rounded-full bg-[#e9e8e6] px-2 py-0.5 text-[10px] font-semibold text-[#444651]">
          {sessions.length}
        </span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {isSessionsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-16 animate-pulse rounded-lg border border-[rgba(197,197,211,0.25)] bg-[#faf9f7]"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] p-4 text-center text-xs text-[#444651]">
            No sessions yet.
            <div className="mt-2">Create your first chat session.</div>
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                "group w-full rounded-lg border px-3 py-2.5 text-left transition-all",
                selectedSessionId === session.id
                  ? "border-[rgba(35,58,135,0.45)] bg-[rgba(35,58,135,0.08)]"
                  : "border-[rgba(197,197,211,0.35)] bg-white hover:border-[rgba(35,58,135,0.28)] hover:bg-[#faf9f7]"
              )}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-medium text-[#1a1c1b]">
                  {session.title || "Untitled session"}
                </p>
                <button
                  type="button"
                  disabled={isDeleteSessionLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#444651] opacity-50 transition hover:bg-[rgba(186,26,26,0.08)] hover:text-[#ba1a1a] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#444651]">
                <MessageSquare className="h-3 w-3" />
                <span>{session.message_count} messages</span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
