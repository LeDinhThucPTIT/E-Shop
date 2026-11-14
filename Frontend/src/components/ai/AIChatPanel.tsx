import type { Product } from "../../types";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, X, ShoppingCart } from "lucide-react";
import { useAIStore } from "../../stores/useAIStore";
import { useCartStore } from "../../stores/useCartStore";
import { useUIStore } from "../../stores/useUIStore";
import { getProductById, useCatalogStore } from "../../stores/useCatalogStore";
import { formatVND } from "../../utils/format";
import { suggestedPrompts } from "../../utils/aiService";
import { Link } from "react-router-dom";

export default function AIChatPanel({
  compact = false,
  onClose,
}: {
  compact?: boolean;
  onClose?: () => void;
}) {
  const { messages, isTyping, sendMessage, clearConversation } = useAIStore();
  const { addItem, isLoading: cartLoading } = useCartStore();
  const { showToast } = useUIStore();
  useCatalogStore((s) => s.products);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const submit = (text: string) => {
    if (!text.trim() || isTyping) return;
    sendMessage(text);
    setInput("");
  };

  const handleAddToCart = async (product: Product) => {
    if (await addItem(product.id, product.sku, 1))
      showToast("Đã thêm vào giỏ hàng", "success");
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white">
            <Sparkles size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              Trợ lý AI NEURALSTORE
            </p>
            <p className="text-xs text-success-600">● Đang hoạt động</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => clearConversation()}
            aria-label="Xóa cuộc trò chuyện"
            className="rounded-sm p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-900"
            title="Xóa cuộc trò chuyện"
          >
            <Trash2 size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-sm p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-900"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-md px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent-500 text-white"
                  : "border border-slate-100 bg-slate-50 text-ink-900"
              }`}
            >
              {msg.content}
              {msg.recommendedProducts &&
                msg.recommendedProducts.length > 0 && (
                  <div
                    className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}
                  >
                    {msg.recommendedProducts.map((pid) => {
                      const product =
                        msg.productSnapshots?.find((p) => p.id === pid) ||
                        getProductById(pid);
                      if (!product) return null;
                      return (
                        <div
                          key={pid}
                          className="flex items-center gap-2.5 rounded-sm border border-slate-200 bg-white p-2"
                        >
                          <Link
                            to={`/products/${product.slug}`}
                            className="shrink-0"
                          >
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 rounded-sm object-cover"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/products/${product.slug}`}
                              className="line-clamp-1 text-xs font-semibold text-ink-900 hover:text-accent-600"
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs font-bold text-accent-600">
                              {formatVND(product.price)}
                            </p>
                          </div>
                          <button
                            disabled={cartLoading || product.stock <= 0}
                            onClick={() => void handleAddToCart(product)}
                            aria-label="Thêm vào giỏ hàng"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white hover:bg-accent-600 disabled:opacity-40"
                          >
                            <ShoppingCart size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => submit(prompt)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-accent-400 hover:text-accent-600"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-slate-100 p-3"
      >
        <input
          maxLength={2000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi trợ lý AI về sản phẩm..."
          aria-label="Nhập tin nhắn cho trợ lý AI"
          className="h-10 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-accent-400 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          aria-label="Gửi tin nhắn"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white disabled:bg-slate-200"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
