import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  Sparkles,
  Clock,
} from "lucide-react";
import Container from "../ui/Container";
import { useCartStore } from "../../stores/useCartStore";
import { useWishlistStore } from "../../stores/useWishlistStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { useUIStore } from "../../stores/useUIStore";
import { useCatalogStore } from "../../stores/useCatalogStore";
import { formatVND } from "../../utils/format";

const NAV_LINKS = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Danh mục", to: "/categories" },
  { label: "Trợ lý AI", to: "/ai-assistant" },
  { label: "So sánh", to: "/compare" },
];

export default function Header() {
  const products = useCatalogStore((s) => s.products);
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const { isAuthenticated, user } = useAuthStore();
  const { setMobileMenuOpen } = useUIStore();

  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("neuralstore-recent-searches") || "[]",
      );
    } catch {
      return [];
    }
  });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = query.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.brand.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  const commitSearch = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...recentSearches.filter((s) => s !== term)].slice(
      0,
      5,
    );
    setRecentSearches(next);
    localStorage.setItem("neuralstore-recent-searches", JSON.stringify(next));
    setShowResults(false);
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/50 glass">
      <Container className="flex h-16 items-center gap-4 lg:gap-8">
        <button
          className="text-slate-600 lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu"
        >
          <Menu size={22} />
        </button>

        <Link to="/" className="flex shrink-0 flex-col leading-none">
          <span className="text-lg font-extrabold tracking-tight text-ink-900">
            NEURAL<span className="gradient-text">STORE</span>
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:block">
            AI Shopping
          </span>
        </Link>

        <div
          ref={searchRef}
          className="relative hidden flex-1 max-w-xl md:block"
        >
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch(query)}
            placeholder="Search products or ask AI..."
            aria-label="Tìm kiếm sản phẩm"
            className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-violet-400 focus:bg-white focus:shadow-glow-violet"
          />
          {showResults && (
            <div className="absolute left-0 right-0 top-12 max-h-96 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg animate-fadeIn">
              {!query.trim() && recentSearches.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold text-slate-400">
                    Tìm kiếm gần đây
                  </p>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => commitSearch(s)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <Clock size={13} className="text-slate-400" /> {s}
                    </button>
                  ))}
                </div>
              )}
              {query.trim() && results.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-slate-400">
                  Không tìm thấy sản phẩm phù hợp
                </p>
              )}
              {results.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.slug}`}
                  onClick={() => setShowResults(false)}
                  className="flex items-center gap-3 rounded-sm p-2 hover:bg-slate-50"
                >
                  <img
                    src={p.images[0]}
                    alt=""
                    className="h-10 w-10 rounded-sm object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatVND(p.price)}
                    </p>
                  </div>
                </Link>
              ))}
              {query.trim() && (
                <button
                  onClick={() => commitSearch(query)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-sm bg-slate-50 py-2 text-xs font-semibold text-accent-600 hover:bg-accent-50"
                >
                  Xem tất cả kết quả cho "{query}"
                </button>
              )}
            </div>
          )}
        </div>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="Điều hướng chính"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-accent-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button
            onClick={() => navigate("/ai-assistant")}
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-accent-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-glow-violet md:flex"
          >
            <Sparkles size={14} /> AI
          </button>
          <Link
            to="/wishlist"
            aria-label="Yêu thích"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <Heart size={19} />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-violet-500 px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            aria-label="Giỏ hàng"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ShoppingCart size={19} />
            {totalItems > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-accent-500 to-violet-500 px-1 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            aria-label="Tài khoản"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            {isAuthenticated && user ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={19} />
            )}
          </Link>
        </div>
      </Container>

      <div className="border-t border-slate-100 px-4 py-2 md:hidden">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search products or ask AI..."
            onKeyDown={(e) =>
              e.key === "Enter" &&
              commitSearch((e.target as HTMLInputElement).value)
            }
            className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-accent-400"
          />
        </div>
      </div>
    </header>
  );
}
