import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Scale, PackageX } from "lucide-react";
import type { Product } from "../../types";
import Rating from "../ui/Rating";
import Badge from "../ui/Badge";
import { formatVND } from "../../utils/format";
import { useWishlistStore } from "../../stores/useWishlistStore";
import { useCartStore } from "../../stores/useCartStore";
import { useCompareStore, MAX_COMPARE } from "../../stores/useCompareStore";
import { useUIStore } from "../../stores/useUIStore";

export default function ProductCard({ product }: { product: Product }) {
  const { has: inWishlist, toggle: toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const {
    has: inCompare,
    add: addCompare,
    remove: removeCompare,
  } = useCompareStore();
  const { showToast } = useUIStore();

  const productId = product.id || product._id;
  const brandName = typeof product.brand === "string" ? product.brand : "";
  const image = product.images?.[0] || product.thumbnail || "";
  const price = product.discountPrice ?? product.price ?? 0;
  const originalPrice =
    product.originalPrice ??
    (product.discountPrice ? product.price : undefined);
  const discount =
    product.discount ??
    (originalPrice && price < originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0);
  const stock = product.stock ?? 0;
  const isWishlisted = inWishlist(productId);
  const isComparing = inCompare(productId);
  const outOfStock = stock === 0;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(productId);
    showToast(
      isWishlisted ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích",
      isWishlisted ? "info" : "success",
    );
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isComparing) {
      removeCompare(productId);
      showToast("Đã xóa khỏi so sánh", "info");
    } else {
      const ok = addCompare(productId);
      if (!ok) {
        showToast(
          `Chỉ có thể so sánh tối đa ${MAX_COMPARE} sản phẩm`,
          "warning",
        );
      } else {
        showToast("Đã thêm vào so sánh", "success");
      }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) return;
    const sku = product.variants[0]?.sku || product.sku;
    if (await addItem(productId, sku, 1))
      showToast("Đã thêm vào giỏ hàng", "success");
  };

  return (
    <Link
      to={`/products/${product.slug || productId}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-violet-300/60 hover:shadow-xl hover:shadow-violet-100/40"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {discount > 0 && <Badge variant="gradient-error">-{discount}%</Badge>}
          {product.trending && (
            <Badge variant="gradient-accent">Xu hướng</Badge>
          )}
          {outOfStock && <Badge variant="default">Hết hàng</Badge>}
        </div>
        <button
          onClick={handleWishlist}
          aria-label={
            isWishlisted ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"
          }
          aria-pressed={isWishlisted}
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm transition-all duration-300 hover:text-rose-500 hover:shadow-md hover:shadow-rose-200/50"
        >
          <Heart
            size={15}
            className={isWishlisted ? "fill-error-500 text-error-500" : ""}
          />
        </button>
        <button
          onClick={handleCompare}
          aria-label={isComparing ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
          aria-pressed={isComparing}
          className={`absolute right-2.5 top-12 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors hover:text-accent-600 ${
            isComparing ? "text-accent-600" : "text-slate-500"
          }`}
        >
          <Scale size={15} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {brandName}
        </span>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink-900">
          {product.name}
        </h3>
        <Rating
          value={product.rating || 0}
          count={product.reviewCount}
          size={12}
        />
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-ink-900">
            {formatVND(price)}
          </span>
          {originalPrice && (
            <span className="text-xs text-slate-400 line-through">
              {formatVND(originalPrice)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {outOfStock ? (
            <span className="flex items-center gap-1 text-slate-400">
              <PackageX size={12} /> Hết hàng
            </span>
          ) : stock <= 5 ? (
            <span className="text-warning-600">Chỉ còn {stock} sản phẩm</span>
          ) : (
            <span className="text-emerald-600">Còn hàng</span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-ink-900 to-ink-800 text-xs font-semibold text-white transition-all duration-300 hover:from-accent-500 hover:to-violet-500 hover:shadow-md hover:shadow-violet-200/50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400"
        >
          <ShoppingCart size={14} />
          Thêm vào giỏ
        </button>
      </div>
    </Link>
  );
}
