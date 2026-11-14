import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Grid3x3,
  ArrowLeft,
} from "lucide-react";
import ToastContainer from "../components/common/ToastContainer";

const links = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Sản phẩm", icon: Package },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/brands", label: "Thương hiệu", icon: Grid3x3 },
  { to: "/admin/categories", label: "Danh mục", icon: Grid3x3 },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-ink-900">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <Link
          to="/"
          className="mb-1 flex items-center gap-2 px-2 py-3 text-sm font-medium text-slate-500 hover:text-accent-600"
        >
          <ArrowLeft size={15} /> Về cửa hàng
        </Link>
        <div className="mb-6 px-2">
          <span className="text-base font-extrabold text-ink-900">
            NEURAL<span className="text-accent-500">STORE</span>
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Admin
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-50 text-accent-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              <link.icon size={17} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-md bg-slate-50 p-3 text-xs text-slate-500">
          Khu vực dành cho quản trị viên.
        </div>
      </aside>
      <div className="flex w-full flex-col lg:pl-60">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5 lg:hidden">
          <span className="text-sm font-extrabold text-ink-900">
            NEURAL<span className="text-accent-500">STORE</span> Admin
          </span>
          <Link to="/" className="text-xs font-medium text-accent-600">
            Về cửa hàng
          </Link>
        </header>
        <main className="flex-1 p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
