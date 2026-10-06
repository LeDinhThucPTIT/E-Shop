import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIMessage } from "../types";
import { getAIResponse } from "../utils/aiService";

interface AIState {
  messages: AIMessage[];
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
}

const WELCOME_MESSAGE: AIMessage = {
  id: "ai-welcome",
  role: "assistant",
  content:
    "Xin chào! Mình là Trợ lý mua sắm AI của NEURALSTORE 👋 Hãy cho mình biết bạn đang tìm sản phẩm gì, ngân sách bao nhiêu, hoặc mục đích sử dụng — mình sẽ gợi ý những lựa chọn phù hợp nhất.",
  timestamp: new Date().toISOString(),
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [WELCOME_MESSAGE],
      isTyping: false,
      sendMessage: async (content) => {
        const userMessage: AIMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };
        set({ messages: [...get().messages, userMessage], isTyping: true });

        const history = get().messages.map((m) => m.content);
        const response = await getAIResponse(content, history);

        const assistantMessage: AIMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content: response.text,
          timestamp: new Date().toISOString(),
          recommendedProducts: response.recommendedProducts.map((p) => p.id),
        };
        set({ messages: [...get().messages, assistantMessage], isTyping: false });
      },
      clearConversation: () => set({ messages: [WELCOME_MESSAGE] }),
    }),
    { name: "neuralstore-ai-conversation" }
  )
);
