import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, FolderKanban, CheckSquare, Layers } from "lucide-react";
import { useCallChatAgentMutation } from "../api/agentApi";
import type { AIAgentSource } from "@/types/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: AIAgentSource[];
}

const SUGGESTIONS = [
  "Cho tôi thông tin về các project đang active",
  "Có task nào đang quá hạn không?",
  "Tóm tắt sprint hiện tại của project",
  "Liệt kê các task được giao cho tôi",
];

function SourceCard({ source }: { source: AIAgentSource }) {
  const rel = source.relation;
  const indexIcon =
    source.index === "tasks" ? (
      <CheckSquare className="h-3 w-3" />
    ) : source.index === "projects" ? (
      <FolderKanban className="h-3 w-3" />
    ) : (
      <Layers className="h-3 w-3" />
    );

  return (
    <div className="flex items-start gap-2 rounded-lg border border-[rgba(197,197,211,0.35)] bg-white px-3 py-2 text-xs">
      <span className="mt-0.5 shrink-0 text-[#233a87]">{indexIcon}</span>
      <div className="min-w-0">
        <p className="font-medium capitalize text-[#1a1c1b]">{source.index}</p>
        {rel?.workspace && (
          <p className="truncate text-[#444651]">
            <span className="text-[#666]">Workspace: </span>
            {rel.workspace.name}
          </p>
        )}
        {rel?.project && (
          <p className="truncate text-[#444651]">
            <span className="text-[#666]">Project: </span>
            {rel.project.name}
            {rel.project.status && (
              <span className="ml-1 rounded bg-[#e9e8e6] px-1 py-0.5 text-[10px] font-medium uppercase text-[#444651]">
                {rel.project.status}
              </span>
            )}
          </p>
        )}
        {rel?.sprint && (
          <p className="truncate text-[#444651]">
            <span className="text-[#666]">Sprint: </span>
            {rel.sprint.name}
          </p>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#444651] opacity-60"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function AgentChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [callAgent, { isLoading }] = useCallChatAgentMutation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await callAgent({ query: trimmed }).unwrap();
      const data = res.data;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources?.length ? data.sources : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#233a87]">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1
            className="text-lg font-bold leading-tight text-[#1a1c1b]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
          >
            AI Assistant
          </h1>
          <p className="text-xs text-[#444651]">
            Hỏi về tasks, projects và sprints của bạn
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-[rgba(197,197,211,0.3)] bg-[#faf9f7]">
        {isEmpty ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9e8e6]">
              <Sparkles className="h-7 w-7 text-[#233a87]" />
            </div>
            <h2
              className="mb-2 text-base font-semibold text-[#1a1c1b]"
              style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
            >
              Bắt đầu cuộc trò chuyện
            </h2>
            <p className="mb-6 max-w-xs text-sm text-[#444651]">
              Tôi có thể giúp bạn tra cứu thông tin về tasks, projects và sprints trong workspace.
            </p>
            <div className="grid w-full max-w-sm gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-lg border border-[rgba(197,197,211,0.4)] bg-white px-4 py-2.5 text-left text-sm text-[#1a1c1b] transition-colors hover:border-[#233a87] hover:bg-[#f4f3f1]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="mr-2.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#233a87]">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%]",
                    msg.role === "user" ? "flex flex-col items-end" : ""
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "rounded-tr-sm bg-[#233a87] text-white"
                        : "rounded-tl-sm bg-[#f4f3f1] text-[#1a1c1b]"
                    )}
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {msg.content}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 w-full space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#444651]">
                        Nguồn tham khảo
                      </p>
                      {msg.sources.map((src) => (
                        <SourceCard key={src.id} source={src} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
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
        )}
      </div>

      {/* Input area */}
      <div className="mt-3 rounded-xl border border-[rgba(197,197,211,0.4)] bg-white px-3 py-2.5 shadow-sm focus-within:border-[#233a87] focus-within:ring-1 focus-within:ring-[#233a87]/20 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập câu hỏi của bạn… (Enter để gửi)"
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-sm text-[#1a1c1b] placeholder:text-[#444651]/50 focus:outline-none disabled:opacity-50"
          style={{ minHeight: "24px", maxHeight: "160px" }}
        />
        <div className="flex items-center justify-between pt-1.5">
          <p className="text-[10px] text-[#444651]/50">
            Shift + Enter để xuống dòng
          </p>
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              input.trim() && !isLoading
                ? "bg-[#233a87] text-white hover:bg-[#1a2d6b]"
                : "bg-[#e9e8e6] text-[#444651]/40 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
