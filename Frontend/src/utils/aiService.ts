import client from "../services/axiosClient";
import { normalizeProduct } from "../services/normalizers";
import type { Product } from "../types";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
  productIds?: string[];
}
export interface AIResponse {
  text: string;
  recommendedProducts: Product[];
}
export async function getAIResponse(
  message: string,
  history: ChatHistoryMessage[] = [],
  signal?: AbortSignal,
): Promise<AIResponse> {
  const { data } = await client.post("/chat", { message, history }, { signal });
  return {
    text: data.data.text,
    recommendedProducts: data.data.recommendedProducts.map(
      (raw: Record<string, any>) => {
        const offer = raw.chatOffer;
        return normalizeProduct({
          ...raw,
          price: offer.price,
          discountPrice: null,
          sku: offer.sku,
          stock: offer.stock,
          images: offer.image ? [offer.image] : raw.images,
        });
      },
    ),
  };
}
export const suggestedPrompts = [
  "Tìm laptop lập trình dưới 30 triệu",
  "Điện thoại từ 5 đến 15 triệu",
  "Tôi cần tai nghe để học tập",
  "Phí giao hàng bao nhiêu?",
  "Có hỗ trợ thanh toán MoMo không?",
];
