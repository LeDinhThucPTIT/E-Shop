import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, PackageSearch } from "lucide-react";
import Container from "../../components/ui/Container";
import ProductCard from "../../components/product/ProductCard";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { formatVND } from "../../utils/format";
import productApi from "../../services/productApi";
import { brandApi } from "../../services/brandApi";
import { categoryApi } from "../../services/categoryApi";
import type { Brand, Category, Product } from "../../types";

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState("");
  const [taxonomyError, setTaxonomyError] = useState("");
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const selectedBrands = useMemo(() => searchParams.getAll("brand"), [searchParams]);
  const minRating = Number(searchParams.get("rating") || 0);
  const maxPrice = Number(searchParams.get("maxPrice") || 70_000_000);
  const availabilityParam = searchParams.get("availability");
  const availability =
    availabilityParam === "in-stock" || availabilityParam === "out-of-stock" ? availabilityParam : "";
  const sort = searchParams.get("sort") || "featured";
  const brandsKey = selectedBrands.join();

  useEffect(() => {
    let active = true;

    const fetchFilters = async () => {
      try {
        const [categoryList, brandList] = await Promise.all([
          categoryApi.getAll({ isActive: true }),
          brandApi.getAll({ isActive: true }),
        ]);
        if (active) {
          setCategories(categoryList);
          setBrands(brandList);
          setTaxonomyError("");
        }
      } catch (fetchError) {
        console.error("Error fetching product filters:", fetchError);
        if (active) setTaxonomyError("Không thể tải danh mục và thương hiệu.");
      } finally {
        if (active) setTaxonomyLoaded(true);
      }
    };

    void fetchFilters();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!taxonomyLoaded) return;

    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      const sortOptions: Record<string, { sortBy: string; order: "asc" | "desc" }> = {
        featured: { sortBy: "featured", order: "desc" },
        trending: { sortBy: "trending", order: "desc" },
        "price-asc": { sortBy: "price", order: "asc" },
        "price-desc": { sortBy: "price", order: "desc" },
        rating: { sortBy: "rating", order: "desc" },
        discount: { sortBy: "discountPrice", order: "desc" },
      };
      const categoryId = categories.find((item) => item.slug === category)?._id;
      const brandIds = selectedBrands
        .map((slug) => brands.find((item) => item.slug === slug)?._id)
        .filter((id): id is string => Boolean(id));

      if ((category && !categoryId) || brandIds.length !== selectedBrands.length) {
        setProducts([]);
        setTotalPages(1);
        setTotalItems(0);
        setLoading(false);
        return;
      }

      try {
        const result = await productApi.getAll({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          category: categoryId,
          brand: brandIds.length ? brandIds.join(",") : undefined,
          minRating: minRating || undefined,
          maxPrice: maxPrice < 70_000_000 ? maxPrice : undefined,
          availability: availability || undefined,
          ...(sortOptions[sort] || sortOptions.featured),
        });

        if (active) {
          setProducts(result.data);
          setTotalPages(Math.max(1, result.pagination.totalPages));
          setTotalItems(result.pagination.totalItems);
        }
      } catch (fetchError) {
        console.error("Error fetching products:", fetchError);
        if (active) {
          setProducts([]);
          setTotalPages(1);
          setTotalItems(0);
          setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchProducts();
    return () => {
      active = false;
    };
  }, [taxonomyLoaded, page, search, category, brandsKey, selectedBrands, minRating, maxPrice, availability, sort, categories, brands, refreshCount]);

  useEffect(() => setPage(1), [search, category, brandsKey, minRating, maxPrice, availability, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const retryFetch = () => setRefreshCount((count) => count + 1);
  const paged = products;

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const toggleBrand = (brand: string) => {
    const next = new URLSearchParams(searchParams);
    const current = next.getAll("brand");
    next.delete("brand");

    if (current.includes(brand)) {
      current.filter((b) => b !== brand).forEach((b) => next.append("brand", b));
    } else {
      [...current, brand].forEach((b) => next.append("brand", b));
    }

    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});
  const hasFilters = category || selectedBrands.length || minRating || maxPrice < 70_000_000 || availability || search;

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Danh mục</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => updateParam("category", null)}
            className={`text-left text-sm transition-colors ${!category ? "font-semibold text-violet-600" : "text-slate-600 hover:text-ink-900"}`}
          >
            Tất cả danh mục
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => updateParam("category", String(c.slug))}
              className={`text-left text-sm transition-colors ${category === c.slug ? "font-semibold text-violet-600" : "text-slate-600 hover:text-ink-900"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Thương hiệu</h3>
        <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <label key={brand._id} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.slug)}
                onChange={() => toggleBrand(brand.slug)}
                className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-400"
              />
              {brand.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Khoảng giá</h3>
        <input
          type="range"
          min={0}
          max={70_000_000}
          step={1_000_000}
          value={maxPrice}
          onChange={(e) => updateParam("maxPrice", e.target.value)}
          className="w-full accent-violet-500"
        />
        <p className="mt-1 text-xs text-slate-500">Đến {formatVND(maxPrice)}</p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Đánh giá tối thiểu</h3>
        <div className="flex gap-2">
          {[4, 4.5, 0].map((r) => (
            <button
              key={r}
              onClick={() => updateParam("rating", r ? String(r) : null)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                minRating === r
                  ? "border-violet-500 bg-gradient-to-r from-violet-50 to-accent-50 text-violet-600"
                  : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
              }`}
            >
              {r === 0 ? "Tất cả" : `${r}+ ★`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Tình trạng</h3>
        <div className="flex flex-col gap-2">
          {[
            { value: "", label: "Tất cả" },
            { value: "in-stock", label: "Còn hàng" },
            { value: "out-of-stock", label: "Hết hàng" },
          ].map((a) => (
            <label key={a.value} className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="radio"
                name="availability"
                checked={availability === a.value}
                onChange={() => updateParam("availability", a.value || null)}
                className="h-4 w-4 border-slate-300 text-violet-500 focus:ring-violet-400"
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Xóa tất cả bộ lọc
        </Button>
      )}
    </div>
  );

  return (
    <Container className="py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            {search ? `Kết quả cho "${search}"` : category ? categories.find((c) => c.slug === category)?.name || "Sản phẩm" : "Tất cả sản phẩm"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{totalItems} sản phẩm</p>
          {taxonomyError && <p className="mt-1 text-sm text-rose-600">{taxonomyError}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-ink-900 lg:hidden"
          >
            <SlidersHorizontal size={15} /> Bộ lọc
          </button>
          <Select value={sort} onChange={(e) => updateParam("sort", e.target.value)} className="w-44">
            <option value="featured">Nổi bật</option>
            <option value="trending">Xu hướng</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="discount">Giảm giá nhiều nhất</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-fit rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sticky top-24 lg:block">
          <FilterPanel />
        </aside>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 animate-slideInRight">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Bộ lọc</h2>
                <button onClick={() => setMobileFiltersOpen(false)} aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>
              <FilterPanel />
              <Button fullWidth className="mt-6" onClick={() => setMobileFiltersOpen(false)}>
                Áp dụng
              </Button>
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-[3/4.2] w-full" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={<PackageSearch size={26} />}
              title="Không thể tải sản phẩm"
              description={error}
              actionLabel="Thử lại"
              onAction={retryFetch}
            />
          ) : paged.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={26} />}
              title="Không tìm thấy sản phẩm"
              description="Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm khác."
              actionLabel="Xóa bộ lọc"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {paged.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`h-9 w-9 rounded-md text-sm font-medium transition-all ${
                        page === i + 1 ? "bg-gradient-to-r from-accent-500 to-violet-500 text-white shadow-md shadow-violet-200/50" : "border border-slate-200 text-slate-600 hover:bg-violet-50 hover:border-violet-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
