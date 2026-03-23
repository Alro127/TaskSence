import { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  appendStreamChunk,
  appendUserMessage,
  finalizeStreaming,
  startStreaming,
} from "../chatSlice";
import type { ChatMessageRequest, ChatMessageResponse } from "@/types/api";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export function useChatStream() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (sessionId: number, request: ChatMessageRequest) => {
      // Abort any in-progress stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Optimistically add user message (temp id = -Date.now())
      const tempUserMsg: ChatMessageResponse = {
        id: -Date.now(),
        role: "USER",
        content: request.content,
        createdAt: new Date().toISOString(),
      };
      dispatch(appendUserMessage(tempUserMsg));
      dispatch(startStreaming());

      try {
        const res = await fetch(
          `${baseUrl}/chat/sessions/${sessionId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify(request),
            signal: controller.signal,
          }
        );

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalMsg: ChatMessageResponse | null = null;
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = line.slice(5).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.chunk !== undefined) {
                  dispatch(appendStreamChunk(parsed.chunk));
                  accumulated += parsed.chunk;
                } else if (parsed.id !== undefined) {
                  finalMsg = parsed as ChatMessageResponse;
                }
              } catch {
                // plain text chunk
                dispatch(appendStreamChunk(data));
                accumulated += data;
              }
            }
          }
        }

        // Always finalize — use JSON message if available, otherwise use accumulated text
        dispatch(
          finalizeStreaming(
            finalMsg ?? {
              id: -Date.now(),
              role: "ASSISTANT",
              content: accumulated,
              createdAt: new Date().toISOString(),
            }
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        dispatch(
          finalizeStreaming({
            id: -Date.now(),
            role: "ASSISTANT",
            content: "Sorry, something went wrong. Please try again.",
            createdAt: new Date().toISOString(),
          })
        );
      }
    },
    [accessToken, dispatch]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, abort };
}
