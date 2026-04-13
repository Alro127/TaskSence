import { Send } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";

import { cn } from "@/lib/utils";

interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  selectedSessionId: number | null;
  isDeleteSessionLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string, textarea: HTMLTextAreaElement) => void;
  onSend: () => void;
}

export function ChatComposer({
  input,
  isLoading,
  selectedSessionId,
  isDeleteSessionLoading,
  textareaRef,
  onInputChange,
  onSend,
}: ChatComposerProps) {
  const disabled = isLoading || selectedSessionId === null || isDeleteSessionLoading;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-[rgba(197,197,211,0.4)] bg-white px-3 py-2.5 shadow-sm transition-all focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20">
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(event) => onInputChange(event.target.value, event.target)}
        onKeyDown={handleKeyDown}
        placeholder={
          selectedSessionId === null
            ? "Create a session first..."
            : "Type your question... (Enter to send)"
        }
        disabled={disabled}
        className="w-full resize-none bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none disabled:opacity-50"
        style={{ minHeight: "24px", maxHeight: "160px" }}
      />
      <div className="flex items-center justify-between pt-1.5">
        <p className="text-[10px] text-text-secondary/50">Shift + Enter for new line</p>
        <button
          onClick={onSend}
          disabled={!input.trim() || isLoading || selectedSessionId === null}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
            input.trim() && !isLoading && selectedSessionId !== null
              ? "bg-brand text-white hover:bg-[#1a2d6b]"
              : "cursor-not-allowed bg-surface-hover text-text-secondary/40"
          )}
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
