import type { AIAgentSource, PaginationMetadata } from "@/types/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: AIAgentSource[];
  pagination?: PaginationMetadata;
}
