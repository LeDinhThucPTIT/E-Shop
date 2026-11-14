import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIMessage } from "../types";
import { getAIResponse, type ChatHistoryMessage } from "../utils/aiService";
import { errorMessage } from "../services/axiosClient";

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
    "Chào bạn! Mình có thể tìm sản phẩm theo ngân sách, so sánh thông số và kiểm tra tồn kho trong cửa hàng. Hãy cho mình biết loại thiết bị và ngân sách của bạn.",
  timestamp: new Date().toISOString(),
};
let controller: AbortController | null = null;
let generation = 0;
export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [WELCOME_MESSAGE],
      isTyping: false,
      sendMessage: async (input) => {
        const content = input.trim();
        if (!content || content.length > 2000 || get().isTyping) return;
        const history: ChatHistoryMessage[] = get()
          .messages.filter((m) => m.id !== "ai-welcome")
          .slice(-12)
          .map((m) => ({
            role: m.role,
            content: m.content.slice(0, 2000),
            ...(m.role === "assistant"
              ? {
                  productIds: (m.recommendedProducts || [])
                    .filter((id) => /^[a-f\d]{24}$/i.test(id))
                    .slice(0, 5),
                }
              : {}),
          }));
        const current = generation;
        controller = new AbortController();
        const userMessage: AIMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content,
          timestamp: new Date().toISOString(),
        };
        set({
          messages: [...get().messages, userMessage].slice(-80),
          isTyping: true,
        });
        try {
          const response = await getAIResponse(
            content,
            history,
            controller.signal,
          );
          if (current !== generation) return;
          const assistantMessage: AIMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response.text,
            timestamp: new Date().toISOString(),
            recommendedProducts: response.recommendedProducts.map((p) => p.id),
            productSnapshots: response.recommendedProducts,
          };
          set({
            messages: [...get().messages, assistantMessage].slice(-80),
            isTyping: false,
          });
        } catch (error) {
          if (current !== generation) return;
          set({
            messages: [
              ...get().messages,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: errorMessage(error),
                timestamp: new Date().toISOString(),
              },
            ].slice(-80) as AIMessage[],
            isTyping: false,
          });
        } finally {
          if (current === generation) controller = null;
        }
      },
      clearConversation: () => {
        generation++;
        controller?.abort();
        controller = null;
        set({ messages: [WELCOME_MESSAGE], isTyping: false });
      },
    }),
    {
      name: "neuralstore-ai-conversation",
      version: 2,
      partialize: (state) => ({ messages: state.messages }),
      migrate: (stored) => {
        const messages = (stored as { messages?: AIMessage[] })?.messages;
        return {
          messages: Array.isArray(messages)
            ? messages
                .filter(
                  (m) =>
                    m &&
                    typeof m.content === "string" &&
                    ["user", "assistant"].includes(m.role),
                )
                .map((m) =>
                  m.id === WELCOME_MESSAGE.id && m.role === "assistant"
                    ? { ...m, content: WELCOME_MESSAGE.content }
                    : m,
                )
                .slice(-80)
            : [WELCOME_MESSAGE],
          isTyping: false,
        };
      },
    },
  ),
);
