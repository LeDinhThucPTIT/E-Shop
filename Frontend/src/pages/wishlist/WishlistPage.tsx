import { useNavigate } from "react-router-dom";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import Container from "../../components/ui/Container";
import EmptyState from "../../components/ui/EmptyState";
import Rating from "../../components/ui/Rating";
import { Link } from "react-router-dom";
import { useWishlistStore } from "../../stores/useWishlistStore";
import { useCartStore } from "../../stores/useCartStore";
import { getProductById } from "../../data/products";
import { formatVND } from "../../utils/format";
import { useUIStore } from "../../stores/useUIStore";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { productIds, remove } = useWishlistStore();
  const { addItem } = useCartStore();
  const { showToast } = useUIStore();

  if (productIds.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Heart size={26} />}
          title="Danh sách yêu thích trống"
          description="Lưu lại những sản phẩm bạn quan tâm để xem lại sau."
          actionLabel="Khám phá sản phẩm"
          onAction={() => navigate("/products")}
        />
      </Container>
    );
  }

  const items = productIds.map((id) => getProductById(id)).filter(Boolean);

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Yêu thích ({items.length})</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => {
          if (!product) return null;
          return (
            <div key={product.id} className="flex gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <Link to={`/products/${product.slug}`} className="shrink-0">
                <img src={product.images[0]} alt={product.name} className="h-20 w-20 rounded-sm object-cover" />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    to={`/products/${product.slug}`}
                    className="line-clamp-2 text-sm font-semibold text-ink-900 hover:text-accent-600"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-1">
                    <Rating value={product.rating} size={11} showValue={false} />
                  </div>
                  <p className="mt-1 text-sm font-bold text-ink-900">{formatVND(product.price)}</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      addItem(product.id, 1);
                      remove(product.id);
                      showToast("Đã chuyển sang giỏ hàng", "success");
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-ink-900 py-1.5 text-xs font-semibold text-white hover:bg-accent-600"
                  >
                    <ShoppingCart size={13} /> Thêm vào giỏ
                  </button>
                  <button
                    onClick={() => {
                      remove(product.id);
                      showToast("Đã xóa khỏi yêu thích", "info");
                    }}
                    aria-label="Xóa khỏi yêu thích"
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 text-slate-400 hover:border-error-300 hover:text-error-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
