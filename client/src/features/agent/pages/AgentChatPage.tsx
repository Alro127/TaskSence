import { useEffect, useMemo, useRef, useState } from "react";
import { Bot } from "lucide-react";
import {
  useCallChatAgentMutation,
  useDeleteSessionMutation,
  useGetSessionMessagesQuery,
  useGetSessionsQuery,
  useInitSessionMutation,
} from "../api/agentApi";
import type { AIAgentSource } from "@/types/api";
import { getApiErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { ChatComposer, ChatConversation, SessionSidebar } from "../components";
import type { ChatMessage, AgentConfirmation } from "../components";

const CONFIRMATION_TOKEN_PATTERNS = [
  /token xac nhan:\s*`?([A-Za-z0-9_-]+)`?/i,
  /confirmationToken\s*[:=]\s*["`']?([A-Za-z0-9_-]+)["`']?/i,
  /confirmation token\s*[:=]\s*["`']?([A-Za-z0-9_-]+)["`']?/i,
];
const CONFIRMATION_EXPIRES_PATTERNS = [
  /het han luc ([^)]+)\)/i,
  /expiresAt\s*[:=]\s*["`']?([^"`'\n,)]+)["`']?/i,
  /expires at\s+([^\n.)]+)/i,
];

function extractConfirmation(content: string): AgentConfirmation | undefined {
  const isRequired = /CONFIRMATION_REQUIRED|confirmation required|confirm before|xac nhan|xác nhận/i.test(content);
  const token = CONFIRMATION_TOKEN_PATTERNS.map((pattern) => content.match(pattern)?.[1]).find(Boolean);
  if (!isRequired && !token) return undefined;

  return {
    token,
    required: true,
    expiresAt: CONFIRMATION_EXPIRES_PATTERNS.map((pattern) => content.match(pattern)?.[1]).find(Boolean),
  };
}

function extractConfirmationFromContext(context: unknown): AgentConfirmation | undefined {
  if (!context || typeof context !== "object" || !("agentConfirmation" in context)) return undefined;
  const confirmation = (context as Record<string, unknown>).agentConfirmation;
  if (!confirmation || typeof confirmation !== "object") return undefined;
  const payload = confirmation as Record<string, unknown>;
  if (payload.required !== true) return undefined;

  return {
    required: true,
    token: typeof payload.token === "string" ? payload.token : undefined,
    expiresAt: typeof payload.expiresAt === "string" ? payload.expiresAt : undefined,
  };
}

export function AgentChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [agentMode, setAgentMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    data: sessionsRes,
    isLoading: isSessionsLoading,
    refetch: refetchSessions,
  } = useGetSessionsQuery({ page: 0, size: 50 });

  const [initSession, { isLoading: isInitSessionLoading }] = useInitSessionMutation();
  const [deleteSession, { isLoading: isDeleteSessionLoading }] = useDeleteSessionMutation();
  const [callAgent, { isLoading: isSendLoading }] = useCallChatAgentMutation();

  const sessions = useMemo(() => sessionsRes?.data?.data ?? [], [sessionsRes]);

  const activeSessionId = useMemo(() => {
    if (selectedSessionId !== null && sessions.some((session) => session.id === selectedSessionId)) {
      return selectedSessionId;
    }
    return sessions[0]?.id ?? null;
  }, [selectedSessionId, sessions]);

  const {
    data: messagesRes,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useGetSessionMessagesQuery(
    { sessionId: activeSessionId ?? 0, page: 0, size: 100 },
    { skip: activeSessionId === null }
  );

  const persistedMessages = useMemo<ChatMessage[]>(() => {
    const rows = messagesRes?.data?.data ?? [];
    const ordered = [...rows].reverse();
    return ordered.map((m) => {
      const message: ChatMessage = {
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      };

      if (m.role === "ASSISTANT") {
        // Extract sources from context if available
        if (Array.isArray(m.sources)) {
          message.sources = m.sources as AIAgentSource[];
        } else if (m.context && typeof m.context === "object" && "documents" in m.context) {
          // Extract from pagination context structure
          const ctx = m.context as Record<string, unknown>;
          if (Array.isArray(ctx.documents)) {
            message.sources = ctx.documents as AIAgentSource[];
          }
        }

        // Extract pagination metadata if available
        if (m.context && typeof m.context === "object" && "pagination" in m.context) {
          const ctx = m.context as Record<string, unknown>;
          if (ctx.pagination && typeof ctx.pagination === "object") {
            message.pagination = ctx.pagination as ChatMessage["pagination"];
          }
        }

        if (m.context && typeof m.context === "object" && "agentReasoning" in m.context) {
          const ctx = m.context as Record<string, unknown>;
          if (Array.isArray(ctx.agentReasoning)) {
            message.reasoning = ctx.agentReasoning.map(String);
          }
        }

        message.confirmation = extractConfirmationFromContext(m.context) ?? extractConfirmation(m.content);
      }

      return message;
    });
  }, [messagesRes]);

  const messages = useMemo(() => {
    if (!pendingUserMessage) return persistedMessages;
    return [...persistedMessages, { role: "user" as const, content: pendingUserMessage }];
  }, [persistedMessages, pendingUserMessage]);

  const isLoading = isSendLoading || isInitSessionLoading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleCreateSession = async () => {
    try {
      const created = await initSession({ title: "" }).unwrap();
      const newSessionId = created.data.id;
      setSelectedSessionId(newSessionId);
      setInput("");
      toast.success("Session created");
      await refetchSessions();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create session."));
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteSession(sessionId).unwrap();
      toast.success("Session deleted");
      await refetchSessions();
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete session."));
    }
  };

  const handleSend = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isSendLoading || activeSessionId === null) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setPendingUserMessage(trimmed);

    try {
      const response = await callAgent({ sessionId: activeSessionId, query: trimmed, agent: agentMode }).unwrap();
      setPendingUserMessage(null);
      await Promise.all([refetchMessages(), refetchSessions()]);
      if (response.data.reasoning?.length) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setPendingUserMessage(null);
      toast.error(getApiErrorMessage(err, "Failed to send message."));
    }
  };

  const handleShowMore = async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message || message.role !== "assistant" || !message.pagination?.has_more) return;
    if (isSendLoading || activeSessionId === null) return;

    // Use the message content as the continuation query (e.g., "show more")
    const continuationQuery = "show more";
    setPendingUserMessage(continuationQuery);

    try {
      await callAgent({ sessionId: activeSessionId, query: continuationQuery, agent: agentMode }).unwrap();
      setPendingUserMessage(null);
      await Promise.all([refetchMessages(), refetchSessions()]);
    } catch (err) {
      setPendingUserMessage(null);
      toast.error(getApiErrorMessage(err, "Failed to load more results."));
    }
  };

  const handleConfirmAction = async (token: string) => {
    await handleSend(`Tôi xác nhận thực hiện hành động này với confirmationToken ${token}`);
  };

  const handleTextareaChange = (value: string, textarea: HTMLTextAreaElement) => {
    setInput(value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[300px_1fr]">
      <SessionSidebar
        sessions={sessions}
        selectedSessionId={activeSessionId}
        isSessionsLoading={isSessionsLoading}
        isInitSessionLoading={isInitSessionLoading}
        isDeleteSessionLoading={isDeleteSessionLoading}
        onCreateSession={handleCreateSession}
        onSelectSession={setSelectedSessionId}
        onDeleteSession={(sessionId) => {
          void handleDeleteSession(sessionId);
        }}
      />

      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1
              className="text-lg font-bold leading-tight text-text-primary"
              style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
            >
              AI Assistant
            </h1>
            <p className="text-xs text-text-secondary">
              Ask about tasks, projects, and sprints.
            </p>
          </div>
        </div>

        <ChatConversation
          selectedSessionId={activeSessionId}
          messages={messages}
          isMessagesLoading={isMessagesLoading}
          isSendLoading={isSendLoading}
          onCreateSession={handleCreateSession}
          onSendSuggestion={handleSend}
          onShowMore={handleShowMore}
          onConfirmAction={handleConfirmAction}
          bottomRef={bottomRef}
        />

        <ChatComposer
          input={input}
          isLoading={isLoading}
          selectedSessionId={activeSessionId}
          isDeleteSessionLoading={isDeleteSessionLoading}
          agentMode={agentMode}
          textareaRef={textareaRef}
          onInputChange={handleTextareaChange}
          onToggleAgentMode={() => setAgentMode((prev) => !prev)}
          onSend={() => {
            void handleSend(input);
          }}
        />
      </div>
    </div>
  );
}
