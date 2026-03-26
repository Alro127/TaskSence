import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Plus, Send, Trash2, X, ChevronLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  closeChat,
  setActiveSession,
  setMessages,
} from "../chatSlice";
import {
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
} from "../api/chatApi";
import { useChatStream } from "../hooks/useChatStream";
import { ChatMessageItem } from "./ChatMessageItem";
import type { ChatSessionResponse } from "@/types/api";

export function ChatPanel() {
  const dispatch = useAppDispatch();
  const { activeSessionId, messages, streamingContent, isStreaming } =
    useAppSelector((s) => s.chat);
  const location = useLocation();

  const workspaceMatch = location.pathname.match(/\/workspaces\/(\d+)/);
  const projectMatch = location.pathname.match(/\/workspaces\/\d+\/projects\/(\d+)/);
  const workspaceId = workspaceMatch ? Number(workspaceMatch[1]) : undefined;
  const projectId = projectMatch ? Number(projectMatch[1]) : undefined;

  const [input, setInput] = useState("");
  const [showSessions, setShowSessions] = useState(!activeSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: sessionsData, refetch: refetchSessions } = useGetSessionsQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );
  const sessions: ChatSessionResponse[] = sessionsData?.data ?? [];

  const { data: sessionData } = useGetSessionQuery(activeSessionId!, {
    skip: !activeSessionId,
  });

  const [createSession] = useCreateSessionMutation();
  const [deleteSession] = useDeleteSessionMutation();
  const { sendMessage, abort } = useChatStream();

  // Populate messages when session data loads
  useEffect(() => {
    if (sessionData?.data?.messages) {
      dispatch(setMessages(sessionData.data.messages));
    }
  }, [sessionData?.data?.messages, dispatch]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleNewSession = async () => {
    try {
      const res = await createSession().unwrap();
      dispatch(setActiveSession(res.data.id));
      setShowSessions(false);
      refetchSessions();
    } catch {
      /* ignore */
    }
  };

  const handleSelectSession = (id: number) => {
    dispatch(setActiveSession(id));
    setShowSessions(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteSession(id);
    if (activeSessionId === id) {
      dispatch(setActiveSession(null));
      setShowSessions(true);
    }
    refetchSessions();
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isStreaming) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      const res = await createSession().unwrap();
      sessionId = res.data.id;
      dispatch(setActiveSession(sessionId));
      setShowSessions(false);
      refetchSessions();
    }

    setInput("");
    await sendMessage(sessionId, { content, context: { workspaceId, projectId } });
    refetchSessions(); // update session title after first message
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-50 flex h-[600px] w-[380px] flex-col rounded-2xl border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          {activeSessionId && !showSessions && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowSessions(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <span className="text-sm font-semibold">TaskSense Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="New chat"
            onClick={handleNewSession}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => dispatch(closeChat())}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSessions ? (
        /* Session list */
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground">Recent conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <Button size="sm" onClick={handleNewSession}>
                  <Plus className="mr-1 h-4 w-4" />
                  Start chatting
                </Button>
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                >
                  <span className="flex-1 truncate">
                    {s.title ?? "New conversation"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteSession(e, s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Chat view */
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="flex flex-col gap-3">
              {messages.length === 0 && !isStreaming && (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <p className="text-sm font-medium">How can I help you?</p>
                  <p className="text-xs text-muted-foreground">
                    Ask about tasks, projects, workload, or anything workspace-related.
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
              {isStreaming && (
                <ChatMessageItem
                  message={{
                    id: -1,
                    role: "ASSISTANT",
                    content: "",
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming
                  streamingContent={streamingContent}
                />
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2">
            <div className="flex items-end gap-2 rounded-xl border bg-muted/50 px-3 py-2">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className={cn(
                  "flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground",
                  "max-h-32 min-h-[1.25rem]"
                )}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = `${t.scrollHeight}px`;
                }}
              />
              {isStreaming ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={abort}
                  title="Stop"
                >
                  <span className="h-3 w-3 rounded-sm bg-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  disabled={!input.trim()}
                  onClick={handleSend}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="mt-1 px-1 text-[10px] text-muted-foreground">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
