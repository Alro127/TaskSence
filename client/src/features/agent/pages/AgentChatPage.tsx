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
import type { ChatMessage } from "../components";

export function AgentChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [input, setInput] = useState("");
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
    return ordered.map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
      sources: m.role === "ASSISTANT" && Array.isArray(m.sources)
        ? (m.sources as AIAgentSource[])
        : undefined,
    }));
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
      await callAgent({ sessionId: activeSessionId, query: trimmed }).unwrap();
      setPendingUserMessage(null);
      await Promise.all([refetchMessages(), refetchSessions()]);
    } catch (err) {
      setPendingUserMessage(null);
      toast.error(getApiErrorMessage(err, "Failed to send message."));
    }
  };

  const handleTextareaChange = (value: string, textarea: HTMLTextAreaElement) => {
    setInput(value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
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

      <div className="flex h-full flex-col">
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
          bottomRef={bottomRef}
        />

        <ChatComposer
          input={input}
          isLoading={isLoading}
          selectedSessionId={activeSessionId}
          isDeleteSessionLoading={isDeleteSessionLoading}
          textareaRef={textareaRef}
          onInputChange={handleTextareaChange}
          onSend={() => {
            void handleSend(input);
          }}
        />
      </div>
    </div>
  );
}
