import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessageResponse } from "@/types/api";

interface ChatState {
  isOpen: boolean;
  activeSessionId: number | null;
  // messages for the active session (includes streaming placeholder)
  messages: ChatMessageResponse[];
  streamingContent: string; // content being streamed currently
  isStreaming: boolean;
}

const initialState: ChatState = {
  isOpen: false,
  activeSessionId: null,
  messages: [],
  streamingContent: "",
  isStreaming: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    openChat(state) {
      state.isOpen = true;
    },
    closeChat(state) {
      state.isOpen = false;
    },
    toggleChat(state) {
      state.isOpen = !state.isOpen;
    },
    setActiveSession(state, action: PayloadAction<number | null>) {
      state.activeSessionId = action.payload;
      state.messages = [];
      state.streamingContent = "";
      state.isStreaming = false;
    },
    setMessages(state, action: PayloadAction<ChatMessageResponse[]>) {
      state.messages = action.payload;
    },
    appendUserMessage(state, action: PayloadAction<ChatMessageResponse>) {
      state.messages.push(action.payload);
    },
    startStreaming(state) {
      state.isStreaming = true;
      state.streamingContent = "";
    },
    appendStreamChunk(state, action: PayloadAction<string>) {
      state.streamingContent += action.payload;
    },
    finalizeStreaming(state, action: PayloadAction<ChatMessageResponse>) {
      state.isStreaming = false;
      state.streamingContent = "";
      state.messages.push(action.payload);
    },
    clearChat() {
      return initialState;
    },
  },
});

export const {
  openChat,
  closeChat,
  toggleChat,
  setActiveSession,
  setMessages,
  appendUserMessage,
  startStreaming,
  appendStreamChunk,
  finalizeStreaming,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;
