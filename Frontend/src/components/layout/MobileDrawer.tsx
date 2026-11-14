import { Link } from "react-router-dom";
import { X, Home, Package, Grid3x3, Sparkles, Scale, Heart, ShoppingCart, User, LogIn } from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";
import { useAuthStore } from "../../stores/useAuthStore";

const links = [
  { label: "Trang chủ", to: "/", icon: Home },
  { label: "Sản phẩm", to: "/products", icon: Package },
  { label: "Danh mục", to: "/categories", icon: Grid3x3 },
  { label: "Trợ lý AI", to: "/ai-assistant", icon: Sparkles },
  { label: "So sánh", to: "/compare", icon: Scale },
  { label: "Yêu thích", to: "/wishlist", icon: Heart },
  { label: "Giỏ hàng", to: "/cart", icon: ShoppingCart },
];

export default function MobileDrawer() {
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  if (!isMobileMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div
        className="absolute inset-0 bg-ink-950/50 animate-fadeIn"
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-5 shadow-lg animate-slideInRight">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-lg font-extrabold text-ink-900">
            NEURAL<span className="gradient-text">STORE</span>
          </span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
            className="text-slate-400 hover:text-ink-900"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
            >
              <link.icon size={18} className="text-slate-400" />
              {link.label}
            </Link>
          ))}
          <div className="my-2 border-t border-slate-100" />
          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {isAuthenticated ? <User size={18} className="text-slate-400" /> : <LogIn size={18} className="text-slate-400" />}
            {isAuthenticated ? "Tài khoản" : "Đăng nhập"}
          </Link>
        </nav>
      </div>
    </div>
  );
}
