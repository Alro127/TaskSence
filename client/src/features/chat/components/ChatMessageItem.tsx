import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageResponse, ChatSourceItem } from "@/types/api";

interface Props {
  message: ChatMessageResponse;
  isStreaming?: boolean;
  streamingContent?: string;
}

function SourceBadge({ source }: { source: ChatSourceItem }) {
  const href =
    source.type === "TASK"
      ? `/workspaces/${source.projectId}/projects/${source.projectId}/tasks/${source.id}`
      : source.type === "PROJECT"
        ? `/workspaces/${source.projectId}/projects/${source.id}`
        : undefined;

  const label =
    source.type === "TASK"
      ? `Task: ${source.title}`
      : source.type === "PROJECT"
        ? `Project: ${source.title}`
        : `Comment: ${source.title}`;

  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <ExternalLink className="h-3 w-3" />
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {label}
    </span>
  );
}

export function ChatMessageItem({ message, isStreaming, streamingContent }: Props) {
  const isUser = message.role === "USER";
  const content = isStreaming ? streamingContent ?? "" : message.content;

  return (
    <div className={cn("flex gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      <div className={cn("flex max-w-[75%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {content}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-current" />
          )}
        </div>

        {!isStreaming && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {message.sources.map((src) => (
              <SourceBadge key={`${src.type}-${src.id}`} source={src} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
