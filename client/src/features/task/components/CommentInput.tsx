import { useState, useRef, useEffect } from "react";
import { Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/utils";
import type { ProjectMember } from "@/types/api";
import { useCreateCommentMutation } from "../api/commentApi";

/** Parse all @tag tokens in `text` and return matching member user IDs. */
function extractMentionIds(text: string, members: ProjectMember[]): number[] {
  const tags = new Set(
    [...text.matchAll(/@(\w+)/g)].map((m) => m[1].toLowerCase()),
  );
  return members
    .filter((m) => {
      const display = m.user.fullName
        ? m.user.fullName.replace(/\s+/g, "").toLowerCase()
        : m.user.email.split("@")[0].toLowerCase();
      return tags.has(display);
    })
    .map((m) => m.user.id);
}

interface CommentInputProps {
  taskId: number;
  parentCommentId?: number;
  members: ProjectMember[];
  onSuccess?: () => void;
  onCancel?: () => void;
  /** Shown in the "Replying to @name" banner */
  replyingToName?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentInput({
  taskId,
  parentCommentId,
  members,
  onSuccess,
  onCancel,
  replyingToName,
  placeholder = "Write a comment… (Ctrl+Enter to submit)",
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAnchorIndex, setMentionAnchorIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [createComment, { isLoading }] = useCreateCommentMutation();

  // Auto-focus when the reply box opens
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [autoFocus, replyingToName]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setContent(value);

    // Detect @mention: look for `@word` immediately before the cursor
    const cursor = e.target.selectionStart;
    const textBefore = value.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionAnchorIndex(cursor - match[0].length);
    } else {
      setMentionQuery(null);
      setMentionAnchorIndex(-1);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      if (mentionQuery !== null) {
        setMentionQuery(null);
      } else {
        onCancel?.();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  function insertMention(user: { fullName: string | null; email: string }) {
    // Normalise name: remove spaces so regex @(\w*)$ continues to work
    const display = user.fullName
      ? user.fullName.replace(/\s+/g, "")
      : user.email.split("@")[0];

    const cursorPos = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, mentionAnchorIndex);
    const after = content.slice(cursorPos);
    const newContent = `${before}@${display} ${after}`;

    setContent(newContent);
    setMentionQuery(null);
    setMentionAnchorIndex(-1);

    // Restore cursor after the inserted mention
    const newPos = mentionAnchorIndex + display.length + 2; // @name + space
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }

  async function handleSubmit() {
    if (!content.trim() || isLoading) return;
    const trimmed = content.trim();
    const mentionUserIds = extractMentionIds(trimmed, members);
    try {
      await createComment({
        taskId,
        content: trimmed,
        ...(parentCommentId !== undefined ? { parentCommentId } : {}),
        ...(mentionUserIds.length > 0 ? { mentionUserIds } : {}),
      }).unwrap();
      setContent("");
      setMentionQuery(null);
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to post comment"));
    }
  }

  const filteredMembers =
    mentionQuery !== null
      ? members
          .filter((m) =>
            (m.user.fullName ?? m.user.email)
              .toLowerCase()
              .includes(mentionQuery),
          )
          .slice(0, 6)
      : [];

  return (
    <div className="space-y-2">
      {/* Replying-to banner */}
      {replyingToName && (
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">
            Replying to{" "}
            <span className="font-medium text-foreground">
              @{replyingToName}
            </span>
          </span>
          <button
            onClick={onCancel}
            className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Textarea + @mention dropdown */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* @mention dropdown */}
        {mentionQuery !== null && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-0 z-50 mb-1 w-60 rounded-md border border-border bg-card shadow-md">
            {filteredMembers.map((m) => (
              <button
                key={m.user.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  insertMention(m.user);
                }}
              >
                {m.user.avatarUrl ? (
                  <img
                    src={m.user.avatarUrl}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {(m.user.fullName ?? m.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.user.fullName ?? m.user.email}
                  </p>
                  {m.user.fullName && (
                    <p className="truncate text-xs text-muted-foreground">
                      {m.user.email}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Ctrl+Enter to submit · @ to mention
        </p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            {replyingToName ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
