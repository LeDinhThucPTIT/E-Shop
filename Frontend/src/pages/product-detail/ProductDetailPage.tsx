import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Heart, Scale, ShoppingCart, Minus, Plus, Truck, ShieldCheck, RotateCcw,
  CheckCircle2, Sparkles, Star,
} from "lucide-react";
import Container from "../../components/ui/Container";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Rating from "../../components/ui/Rating";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ProductCard from "../../components/product/ProductCard";
import EmptyState from "../../components/ui/EmptyState";
import { getReviewsForProduct } from "../../data/reviews";
import { formatVND, formatDate } from "../../utils/format";
import productApi from "../../services/productApi";
import type { Product } from "../../types";
import { useCartStore } from "../../stores/useCartStore";
import { useWishlistStore } from "../../stores/useWishlistStore";
import { useCompareStore, MAX_COMPARE } from "../../stores/useCompareStore";
import { useUIStore } from "../../stores/useUIStore";

const RECENTLY_VIEWED_KEY = "neuralstore-recently-viewed";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addItem } = useCartStore();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlistStore();
  const { has: inCompare, add: addCompare } = useCompareStore();
  const { showToast } = useUIStore();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"description" | "specs" | "reviews" | "qa">("description");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;

    if (!slug) {
      setProduct(null);
      setProductError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setProductError("");
    void productApi
      .getById(slug)
      .then((result) => {
        if (active) setProduct(result);
      })
      .catch((error: unknown) => {
        console.error("Error fetching product details:", error);
        if (active) {
          setProduct(null);
          setProductError("Không thể tải thông tin sản phẩm. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const productId = product?.id || product?._id;
  const productCategory = product?.category;
  const categoryId =
    typeof productCategory === "string" ? productCategory : productCategory?._id;

  useEffect(() => {
    if (!productId) return;

    setActiveImage(0);
    setQuantity(1);
    setTab("description");
    window.scrollTo(0, 0);

    try {
      const stored: unknown = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
      const storedIds = Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string")
        : [];
      const next = [productId, ...storedIds.filter((id) => id !== productId)].slice(0, 8);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      setRecentlyViewedIds(next.filter((id) => id !== productId));
    } catch {
      setRecentlyViewedIds([]);
    }
  }, [productId]);

  useEffect(() => {
    let active = true;
    setRecommendations([]);

    if (categoryId) {
      void productApi
        .getAll({ category: categoryId, limit: 12, sortBy: "rating", order: "desc" })
        .then((result) => {
          if (active) {
            setRecommendations(
              result.data.filter((item) => (item.id || item._id) !== productId),
            );
          }
        })
        .catch((error: unknown) => {
          console.error("Error fetching related products:", error);
        });
    }

    return () => {
      active = false;
    };
  }, [categoryId, productId]);

  useEffect(() => {
    let active = true;
    setRecentProducts([]);

    if (recentlyViewedIds.length > 0) {
      void Promise.allSettled(recentlyViewedIds.slice(0, 4).map((id) => productApi.getById(id)))
        .then((results) => {
          if (!active) return;
          results.forEach((result) => {
            if (result.status === "rejected") {
              console.error("Error fetching a recently viewed product:", result.reason);
            }
          });
          setRecentProducts(
            results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : [])),
          );
        });
    }

    return () => {
      active = false;
    };
  }, [recentlyViewedIds]);

  if (loading) {
    return (
      <Container className="py-16">
        <p className="text-center text-sm text-slate-500">Đang tải thông tin sản phẩm...</p>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Star size={26} />}
          title={productError ? "Không thể tải sản phẩm" : "Không tìm thấy sản phẩm"}
          description={productError || "Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không chính xác."}
          actionLabel="Về trang sản phẩm"
          onAction={() => navigate("/products")}
        />
      </Container>
    );
  }

  const brandName =
    typeof product.brand === "string" ? product.brand : product.brand?.name || "";
  const categoryLabel =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "Sản phẩm";
  const categorySlug =
    typeof product.category === "string"
      ? product.category
      : product.category?.slug || product.category?._id || "";
  const productImages = product.images?.length
    ? product.images
    : product.thumbnail
      ? [product.thumbnail]
      : [];
  const price = product.discountPrice ?? product.price ?? 0;
  const originalPrice =
    product.originalPrice ?? (product.discountPrice && product.discountPrice < (product.price ?? 0)
      ? product.price
      : undefined);
  const discount =
    product.discount ??
    (originalPrice && price < originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0);
  const stock = product.stock ?? 0;
  const warranty = product.warranty ?? 0;
  const reviews = getReviewsForProduct(productId || "");
  const related = recommendations.slice(0, 4);
  const aiPicks = recommendations.slice(0, 3);

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const handleAddToCart = () => {
    if (stock === 0 || !productId) return;
    addItem(productId, quantity);
    showToast("Đã thêm vào giỏ hàng", "success");
  };

  const handleBuyNow = () => {
    if (stock === 0 || !productId) return;
    addItem(productId, quantity);
    navigate("/checkout");
  };

  const handleCompare = () => {
    if (!productId) return;
    const ok = addCompare(productId);
    if (!ok) showToast(`Chỉ có thể so sánh tối đa ${MAX_COMPARE} sản phẩm`, "warning");
    else navigate("/compare");
  };

  return (
    <Container className="py-8">
      <Breadcrumb
        items={[
          { label: categoryLabel, to: `/products?category=${categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {productImages[activeImage] ? (
              <img
                src={productImages[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          {productImages.length > 1 && (
            <div className="mt-3 flex gap-3">
              {productImages.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    activeImage === i ? "border-violet-500 shadow-md shadow-violet-200/50" : "border-transparent hover:border-slate-300"
                  }`}
                  aria-label={`Ảnh ${i + 1}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            {brandName}
          </span>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-ink-900 sm:text-3xl">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={product.rating ?? 0} count={product.reviewCount} />
            {product.trending && <Badge variant="accent">Xu hướng</Badge>}
          </div>

          <div className="mt-5 flex items-baseline gap-3 border-b border-slate-100 pb-5">
            <span className="text-3xl font-extrabold gradient-text">{formatVND(price)}</span>
            {originalPrice && (
              <>
                <span className="text-base text-slate-400 line-through">
                  {formatVND(originalPrice)}
                </span>
                <Badge variant="error">-{discount}%</Badge>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">{product.description}</p>

          <div className="mt-5">
            {stock === 0 ? (
              <Badge variant="default">Hết hàng</Badge>
            ) : stock <= 5 ? (
              <Badge variant="warning">Chỉ còn {stock} sản phẩm</Badge>
            ) : (
              <Badge variant="success">Còn hàng</Badge>
            )}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm font-medium text-ink-900">Số lượng</span>
            <div className="flex items-center rounded-md border border-slate-300">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Giảm số lượng"
                className="flex h-10 w-10 items-center justify-center text-slate-500 hover:text-ink-900"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                aria-label="Tăng số lượng"
                className="flex h-10 w-10 items-center justify-center text-slate-500 hover:text-ink-900"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="outline"
              icon={<ShoppingCart size={18} />}
              disabled={stock === 0}
              onClick={handleAddToCart}
              className="flex-1 min-w-[160px]"
            >
              Thêm vào giỏ
            </Button>
            <Button
              size="lg"
              disabled={stock === 0}
              onClick={handleBuyNow}
              className="flex-1 min-w-[160px]"
            >
              Mua ngay
            </Button>
          </div>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => {
                if (!productId) return;
                toggleWishlist(productId);
                showToast(
                  inWishlist(productId) ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích",
                  "success"
                );
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:border-error-300 hover:text-error-500"
            >
              <Heart size={15} className={productId && inWishlist(productId) ? "fill-error-500 text-error-500" : ""} />
              Yêu thích
            </button>
            <button
              onClick={handleCompare}
              disabled={Boolean(productId && inCompare(productId))}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:border-accent-300 hover:text-accent-600 disabled:opacity-50"
            >
              <Scale size={15} />
              {productId && inCompare(productId) ? "Đã thêm so sánh" : "So sánh"}
            </button>
          </div>

          <div className="mt-6 space-y-3 rounded-lg border border-violet-100/50 bg-gradient-to-r from-slate-50 to-violet-50/30 p-4">
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Truck size={16} className="text-violet-600" /> Giao hàng nhanh 24-48h nội thành
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <ShieldCheck size={16} className="text-violet-600" /> Bảo hành chính hãng {warranty} tháng
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <RotateCcw size={16} className="text-violet-600" /> Đổi trả miễn phí trong 15 ngày
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex gap-6 border-b border-slate-200">
          {[
            { key: "description", label: "Mô tả" },
            { key: "specs", label: "Thông số kỹ thuật" },
            { key: "reviews", label: `Đánh giá (${reviews.length})` },
            { key: "qa", label: "Hỏi đáp" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
                tab === t.key ? "border-violet-500 text-violet-600" : "border-transparent text-slate-500 hover:text-ink-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === "description" && (
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{product.description}</p>
          )}

          {tab === "specs" && (
            <div className="max-w-2xl divide-y divide-slate-100 rounded-md border border-slate-100">
              {(product.specifications || []).map((spec) => (
                <div key={spec._id || spec.name} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-slate-500">{spec.name}</span>
                  <span className="text-right font-medium text-ink-900">{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold text-ink-900">{(product.rating ?? 0).toFixed(1)}</span>
                  <div>
                    <Rating value={product.rating ?? 0} showValue={false} />
                    <p className="text-xs text-slate-500">{product.reviewCount} đánh giá</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  {ratingDistribution.map((d) => (
                    <div key={d.star} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-8">{d.star} ★</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-warning-500"
                          style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-4 text-right">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="border-b border-slate-100 pb-6 last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{r.author}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Rating value={r.rating} showValue={false} size={12} />
                            {r.verified && (
                              <span className="flex items-center gap-1 text-xs text-success-600">
                                <CheckCircle2 size={11} /> Đã mua hàng
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{r.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "qa" && (
            <div className="max-w-2xl">
              <p className="text-sm text-slate-500">Chưa có câu hỏi nào cho sản phẩm này.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast("Câu hỏi của bạn đã được gửi!", "success");
                  (e.target as HTMLFormElement).reset();
                }}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  placeholder="Đặt câu hỏi về sản phẩm này..."
                  aria-label="Câu hỏi"
                  required
                  className="h-11 flex-1 rounded-md border border-slate-300 px-4 text-sm outline-none focus:border-accent-500 focus:shadow-glow"
                />
                <Button type="submit">Gửi câu hỏi</Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation */}
      {aiPicks.length > 0 && (
        <section className="mt-4 rounded-xl border border-violet-200/50 bg-gradient-to-r from-violet-50/50 to-cyan-50/30 p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles size={18} className="text-violet-600" />
            <h2 className="text-lg font-bold text-ink-900">AI gợi ý cho bạn</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {aiPicks.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-xl font-bold text-ink-900">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recentProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-xl font-bold text-ink-900">Đã xem gần đây</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
