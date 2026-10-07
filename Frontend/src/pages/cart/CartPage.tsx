import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useCartStore } from "../../stores/useCartStore";
import { getProductById } from "../../data/products";
import { formatVND } from "../../utils/format";
import { useUIStore } from "../../stores/useUIStore";

export default function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const { showToast } = useUIStore();

  if (items.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy khám phá các sản phẩm công nghệ mới nhất và thêm vào giỏ hàng."
          actionLabel="Khám phá sản phẩm"
          onAction={() => navigate("/products")}
        />
      </Container>
    );
  }
  const clearCart = useCartStore((state) => state.clearCart);
  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">
          Giỏ hàng ({items.length})
        </h1>
        <button
          onClick={() => {
            clearCart();
            showToast("Đã xóa toàn bộ giỏ hàng", "info");
          }}
          className="text-sm font-medium text-slate-500 hover:text-error-500"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-sm">
          {items.map((item) => {
            const product = getProductById(item.product._id);
            if (!product) return null;
            return (
              <div key={item.product._id} className="flex gap-4 p-4">
                <Link to={`/products/${product.slug}`} className="shrink-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-20 w-20 rounded-sm object-cover sm:h-24 sm:w-24"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link
                        to={`/products/${product.slug}`}
                        className="text-sm font-semibold text-ink-900 hover:text-accent-600 sm:text-base"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">
                        {product.brand || ""}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      aria-label="Xóa sản phẩm"
                      className="h-fit text-slate-400 hover:text-error-500"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center rounded-md border border-slate-300">
                      <button
                        onClick={() => decrement(item.productId)}
                        aria-label="Giảm số lượng"
                        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-ink-900"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increment(item.productId)}
                        aria-label="Tăng số lượng"
                        disabled={item.quantity >= product.stock}
                        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-ink-900 disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-ink-900 sm:text-base">
                      {formatVND(product.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-fit overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-accent-500 via-violet-500 to-cyan-500" />
          <div className="p-5">
            <h2 className="text-base font-semibold text-ink-900">
              Tóm tắt đơn hàng
            </h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatVND(sub)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Giảm giá</span>
                <span>-{formatVND(discount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{shipping === 0 ? "Miễn phí" : formatVND(shipping)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Thuế ước tính (8%)</span>
                <span>{formatVND(tax)}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-base font-bold text-ink-900">
              <span>Tổng cộng</span>
              <span className="gradient-text">{formatVND(total)}</span>
            </div>
            <Button
              fullWidth
              size="lg"
              variant="gradient"
              className="mt-5"
              icon={<ArrowRight size={17} />}
              style={{ flexDirection: "row-reverse" }}
              onClick={() => navigate("/checkout")}
            >
              Tiến hành thanh toán
            </Button>
            <Link
              to="/products"
              className="mt-3 block text-center text-sm font-medium text-violet-600 hover:underline"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
