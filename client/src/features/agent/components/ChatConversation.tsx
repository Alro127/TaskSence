import { Bot, Sparkles, ArrowDown, ChevronDown } from "lucide-react";
import type { RefObject } from "react";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

import { SourceCard } from "./SourceCard";
import { TypingDots } from "./TypingDots";
import type { ChatMessage } from "./types";

const SUGGESTIONS = [
  "Cho tôi thông tin về các project đang active",
  "Có task nào đang quá hạn không?",
  "Tóm tắt sprint hiện tại của project",
  "Liệt kê các task được giao cho tôi",
];

interface ChatConversationProps {
  selectedSessionId: number | null;
  messages: ChatMessage[];
  isMessagesLoading: boolean;
  isSendLoading: boolean;
  onCreateSession: () => void;
  onSendSuggestion: (query: string) => void;
  onShowMore: (messageIndex: number) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
}

export function ChatConversation({
  selectedSessionId,
  messages,
  isMessagesLoading,
  isSendLoading,
  onCreateSession,
  onSendSuggestion,
  onShowMore,
  bottomRef,
}: ChatConversationProps) {
  const isEmpty = messages.length === 0;
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSendLoading]);

  return (
    <div className="flex-1 flex flex-col rounded-xl border border-[rgba(197,197,211,0.3)] bg-[#faf9f7] overflow-hidden relative">
      {selectedSessionId === null ? (
        <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9e8e6]">
            <Sparkles className="h-7 w-7 text-[#233a87]" />
          </div>
          <h2
            className="mb-2 text-base font-semibold text-[#1a1c1b]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
          >
            Start a new chat session
          </h2>
          <button
            onClick={onCreateSession}
            className="rounded-lg bg-[#233a87] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2d6b]"
          >
            Create Session
          </button>
        </div>
      ) : isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9e8e6]">
            <Sparkles className="h-7 w-7 text-[#233a87]" />
          </div>
          <h2
            className="mb-2 text-base font-semibold text-[#1a1c1b]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
          >
            Start the conversation
          </h2>
          <p className="mb-6 max-w-xs text-sm text-[#444651]">
            I can help you quickly find updates about tasks, projects, and sprint progress.
          </p>
          <div className="grid w-full max-w-sm gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSendSuggestion(suggestion)}
                className="rounded-lg border border-[rgba(197,197,211,0.4)] bg-white px-4 py-2.5 text-left text-sm text-[#1a1c1b] transition-colors hover:border-[#233a87] hover:bg-[#f4f3f1]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  {message.role === "assistant" && (
                    <div className="mr-2.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#233a87]">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%]",
                      message.role === "user" ? "flex flex-col items-end" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm",
                        message.role === "user"
                          ? "rounded-tr-sm bg-[#233a87] text-white"
                          : "rounded-tl-sm bg-[#f4f3f1] text-[#1a1c1b]"
                      )}
                      style={{ wordBreak: "break-word" }}
                    >
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          skipHtml
                          components={{
                            p: ({ children }) => <p className="mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="my-0 ml-4 list-disc space-y-0">{children}</ul>,
                            ol: ({ children }) => <ol className="my-0 ml-4 list-decimal space-y-0">{children}</ol>,
                            li: ({ children }) => <li className="mb-0">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => (
                              <code className="rounded bg-[#e9e8e6] px-1.5 py-0.5 font-mono text-xs">
                                {children}
                              </code>
                            ),
                            a: ({ children, href }) => (
                              <a href={href} className="underline hover:text-blue-600">
                                {children}
                              </a>
                            ),
                            h1: ({ children }) => <h1 className="text-base font-bold">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-bold">{children}</h3>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-[#233a87] pl-2">{children}</blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 w-full space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#444651]">
                          Sources {message.sources.length > 5 && `(${message.sources.length})`}
                        </p>
                        {(() => {
                          const isExpanded = expandedSources.has(index);
                          const visibleSources = isExpanded ? message.sources : message.sources.slice(0, 5);
                          const hasMore = message.sources.length > 5;

                          return (
                            <div className="space-y-1.5">
                              {visibleSources.map((source) => (
                                <SourceCard key={source.id} source={source} />
                              ))}
                              {hasMore && (
                                <button
                                  onClick={() => {
                                    setExpandedSources((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(index)) {
                                        next.delete(index);
                                      } else {
                                        next.add(index);
                                      }
                                      return next;
                                    });
                                  }}
                                  className="text-xs text-[#233a87] hover:text-[#1a2d6b] font-medium transition-colors flex items-center gap-1"
                                >
                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                  {isExpanded ? "Show less" : `Show all (${message.sources.length})`}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Pagination "Show More" button */}
                    {message.role === "assistant" && message.pagination?.has_more && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => onShowMore(index)}
                          disabled={isSendLoading}
                          className="flex items-center gap-1 rounded-lg bg-[#233a87] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1a2d6b] disabled:opacity-50"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                          Show {message.pagination.remaining_count} more
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(isSendLoading || isMessagesLoading) && (
              <div className="flex justify-start">
                <div className="mr-2.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#233a87]">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-[#f4f3f1] px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 right-4 p-2 rounded-full bg-[#233a87] text-white shadow-lg hover:bg-[#1a2d6b] transition-colors"
              title="Scroll to latest messages"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
