import { useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WorkflowStepResponse } from "@/types/api";

type MockComment = {
  id: number;
  stepNumber: number;
  name: string;
  initials: string;
  postedAt: string;
  content: string;
  reactions: Array<{ emoji: string; count: number }>;
  reply?: {
    name: string;
    initials: string;
    postedAt: string;
    content: string;
  };
};

const MOCK_COMMENTS: MockComment[] = [
  {
    id: 1,
    stepNumber: 1,
    name: "Dr. Sarah Jenkins",
    initials: "SJ",
    postedAt: "2 hours ago",
    content:
      "This protocol is incredibly thorough. I am seeing great results with the synaptic mapping step.",
    reactions: [
      { emoji: "👍", count: 3 },
      { emoji: "❤️", count: 1 },
    ],
    reply: {
      name: "Prof. Marcus Chen",
      initials: "MC",
      postedAt: "1 hour ago",
      content: "Agreed @Sarah Jenkins, the noise floor normalization makes a huge difference.",
    },
  },
  {
    id: 2,
    stepNumber: 3,
    name: "Elena Rossi",
    initials: "ER",
    postedAt: "5 hours ago",
    content:
      "Has anyone tried this with fixed tissue instead of live cells? Looking for adjustments in step 3.",
    reactions: [],
  },
];

interface PublicWorkflowReviewsTabProps {
  steps: WorkflowStepResponse[];
}

export function PublicWorkflowReviewsTab({ steps }: PublicWorkflowReviewsTabProps) {
  const [activeReviewFilter, setActiveReviewFilter] = useState<number | "all">("all");

  const displayedComments = useMemo(() => {
    if (activeReviewFilter === "all") {
      return MOCK_COMMENTS;
    }
    return MOCK_COMMENTS.filter((comment) => comment.stepNumber === activeReviewFilter);
  }, [activeReviewFilter]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            activeReviewFilter === "all"
              ? "bg-[#233a87] text-white"
              : "border border-[rgba(197,197,211,0.35)] bg-white text-[#444651]"
          }`}
          onClick={() => setActiveReviewFilter("all")}
        >
          All
        </button>
        {steps.map((step) => (
          <button
            type="button"
            key={step.id}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              activeReviewFilter === step.position + 1
                ? "bg-[#233a87] text-white"
                : "border border-[rgba(197,197,211,0.35)] bg-white text-[#444651]"
            }`}
            onClick={() => setActiveReviewFilter(step.position + 1)}
          >
            Step {step.position + 1}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-y border-[#efeeec] py-3">
        <span className="text-sm font-semibold text-[#1a1c1b]">{displayedComments.length} comments</span>
        <span className="text-xs text-[#444651]">Sort by: Newest first</span>
      </div>

      <div className="space-y-6">
        {displayedComments.map((comment) => (
          <article key={comment.id} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)] text-xs font-bold text-[#233a87]">
                {comment.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1a1c1b]">{comment.name}</h3>
                  <span className="text-xs text-[#444651]">{comment.postedAt}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#444651]">{comment.content}</p>
                <div className="mt-2 flex items-center gap-2">
                  {comment.reactions.map((reaction) => (
                    <span
                      key={`${comment.id}-${reaction.emoji}`}
                      className="inline-flex items-center gap-1 rounded-md bg-[#f4f3f1] px-2 py-1 text-xs text-[#444651]"
                    >
                      {reaction.emoji}
                      <span className="font-semibold">{reaction.count}</span>
                    </span>
                  ))}
                  <button type="button" className="text-xs font-semibold text-[#233a87] hover:underline">
                    Reply
                  </button>
                </div>

                {comment.reply && (
                  <div className="mt-4 flex gap-3 border-l-2 border-[#efeeec] pl-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(35,58,135,0.08)] text-[10px] font-bold text-[#233a87]">
                      {comment.reply.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#1a1c1b]">{comment.reply.name}</h4>
                        <span className="text-xs text-[#444651]">{comment.reply.postedAt}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#444651]">{comment.reply.content}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="ghost-border rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-[rgba(197,197,211,0.35)] bg-[#f4f3f1] px-3 py-1.5 text-xs font-medium text-[#444651]"
          >
            Tag a step (optional)
          </button>
          <span className="text-xs text-[#444651]">Markdown supported</span>
        </div>
        <textarea
          rows={3}
          placeholder="Add a comment... use @ to mention someone"
          className="w-full resize-none rounded-md border border-[rgba(197,197,211,0.35)] bg-[#faf9f7] px-3 py-2 text-sm text-[#1a1c1b] placeholder:text-[#444651] focus:outline-none focus:ring-2 focus:ring-[rgba(35,58,135,0.2)]"
        />
        <div className="mt-3 flex justify-end">
          <Button className="bg-[#233a87] text-white hover:opacity-90">
            <MessageSquare className="h-4 w-4" />
            Post Comment
          </Button>
        </div>
      </div>
    </>
  );
}
