import { products } from "../data/products";
import type { Product } from "../types";
import { formatVND } from "./format";

export interface AIResponse {
  text: string;
  recommendedProducts: Product[];
}

/**
 * aiService.ts
 * ------------------------------------------------------------------
 * Mock AI shopping assistant "brain". This module is intentionally
 * isolated behind a single `getAIResponse` function so that a real
 * backend (OpenAI, Gemini, Claude, or a custom service) can be wired
 * in later without touching any UI code — just replace the body of
 * `getAIResponse` with a fetch() call to your LLM backend and keep
 * the same return shape.
 * ------------------------------------------------------------------
 */

function extractBudget(query: string): number | null {
  const millionMatch = query.match(/(\d+([.,]\d+)?)\s*(triệu|tr\b|m\b)/i);
  if (millionMatch) {
    return parseFloat(millionMatch[1].replace(",", ".")) * 1_000_000;
  }
  const vndMatch = query.match(/(\d{2,3}([.,]\d{3})+)\s*(đ|vnd|₫)?/i);
  if (vndMatch) {
    return parseFloat(vndMatch[1].replace(/[.,]/g, ""));
  }
  return null;
}

function detectCategory(query: string): string | null {
  const q = query.toLowerCase();
  const map: Record<string, string[]> = {
    laptop: ["laptop", "macbook", "máy tính xách tay"],
    gpu: ["gpu", "card đồ họa", "vga", "card màn hình"],
    cpu: ["cpu", "chip xử lý", "vi xử lý"],
    monitor: ["màn hình", "monitor"],
    keyboard: ["bàn phím", "keyboard"],
    mouse: ["chuột", "mouse"],
    headphones: ["tai nghe", "headphone", "headphones"],
    smartwatch: ["đồng hồ", "watch"],
    "ai-hardware": ["ai hardware", "kính vr", "jetson", "mixed reality", "quest"],
    smartphone: ["điện thoại", "smartphone", "iphone", "samsung"],
    "smart-home": ["nhà thông minh", "smart home"],
    accessories: ["phụ kiện", "sạc dự phòng", "stream deck"],
  };
  for (const [category, keywords] of Object.entries(map)) {
    if (keywords.some((k) => q.includes(k))) return category;
  }
  return null;
}

function detectIntent(query: string): "programming" | "gaming" | "ml" | "study" | "general" {
  const q = query.toLowerCase();
  if (q.includes("lập trình") || q.includes("code") || q.includes("dev")) return "programming";
  if (q.includes("game") || q.includes("gaming") || q.includes("chơi game")) return "gaming";
  if (q.includes("machine learning") || q.includes("ai") || q.includes("huấn luyện")) return "ml";
  if (q.includes("học") || q.includes("study")) return "study";
  return "general";
}

function scoreProduct(p: Product, intent: string): number {
  let score = p.rating * 10 + (p.trending ? 5 : 0) + (p.featured ? 3 : 0);
  const tagText = p.tags.join(" ").toLowerCase();
  if (intent === "programming" && (tagText.includes("lập trình") || tagText.includes("developer"))) score += 20;
  if (intent === "gaming" && tagText.includes("gaming")) score += 20;
  if (intent === "ml" && (tagText.includes("ai") || p.category === "gpu" || p.category === "ai-hardware")) score += 20;
  if (intent === "study" && (p.category === "headphones" || p.category === "laptop")) score += 10;
  return score;
}

export async function getAIResponse(query: string, _history: string[] = []): Promise<AIResponse> {
  // Simulate network latency for a realistic assistant feel.
  await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));

  const budget = extractBudget(query);
  const category = detectCategory(query);
  const intent = detectIntent(query);

  let pool = products;
  if (category) pool = pool.filter((p) => p.category === category);
  if (budget) pool = pool.filter((p) => p.price <= budget);

  const ranked = [...pool].sort((a, b) => scoreProduct(b, intent) - scoreProduct(a, intent));
  const recommended = ranked.slice(0, budget || category ? 5 : 4);

  if (recommended.length === 0) {
    return {
      text: `Mình chưa tìm thấy sản phẩm phù hợp trong ngân sách hoặc danh mục bạn đưa ra${
        budget ? ` (dưới ${formatVND(budget)})` : ""
      }. Bạn có thể thử nới ngân sách hoặc mô tả rõ hơn nhu cầu (ví dụ: dùng để làm gì, thương hiệu ưa thích) để mình gợi ý chính xác hơn nhé.`,
      recommendedProducts: [],
    };
  }

  const intentLabel: Record<string, string> = {
    programming: "lập trình",
    gaming: "chơi game",
    ml: "AI/machine learning",
    study: "học tập",
    general: "nhu cầu của bạn",
  };

  const reasons = recommended
    .map((p, i) => {
      const bits: string[] = [];
      if (p.trending) bits.push("đang được nhiều người quan tâm");
      if (p.rating >= 4.6) bits.push(`đánh giá cao ${p.rating}/5`);
      if (p.discount) bits.push(`đang giảm ${p.discount}%`);
      const reasonText = bits.length ? bits.join(", ") : "phù hợp với tiêu chí bạn đưa ra";
      return `${i + 1}. **${p.name}** (${formatVND(p.price)}) — ${reasonText}.`;
    })
    .join("\n");

  const budgetLine = budget ? ` trong ngân sách khoảng ${formatVND(budget)}` : "";
  const text = `Dựa trên nhu cầu về ${intentLabel[intent]}${budgetLine}, mình gợi ý một vài lựa chọn sau:\n\n${reasons}\n\nBạn muốn mình so sánh chi tiết hơn giữa các sản phẩm này, hay thêm sản phẩm nào vào giỏ hàng luôn?`;

  return { text, recommendedProducts: recommended };
}

export const suggestedPrompts = [
  "Tìm laptop lập trình dưới 30 triệu VND",
  "GPU nào tốt nhất để phát triển AI?",
  "So sánh hai laptop gaming",
  "Tôi cần tai nghe để học tập",
  "Xây dựng cấu hình PC cho machine learning",
  "Tôi có 20 triệu VND, nên mua gì?",
];
