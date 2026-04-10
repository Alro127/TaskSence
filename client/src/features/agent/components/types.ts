import type { AIAgentSource } from "@/types/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: AIAgentSource[];
}
