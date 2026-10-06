import { DollarSign, ShoppingBag, Package, Users, TrendingUp } from "lucide-react";
import { products } from "../../data/products";
import { useOrdersStore } from "../../stores/useOrdersStore";
import { formatVND } from "../../utils/format";

const revenueByMonth = [
  { month: "T1", value: 320 }, { month: "T2", value: 410 }, { month: "T3", value: 380 },
  { month: "T4", value: 520 }, { month: "T5", value: 490 }, { month: "T6", value: 610 },
  { month: "T7", value: 580 }, { month: "T8", value: 690 },
];

export default function AdminDashboardPage() {
  const { orders } = useOrdersStore();
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0) || 1_284_500_000;
  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.value));

  const stats = [
    { label: "Doanh thu", value: formatVND(totalRevenue), icon: DollarSign, delta: "+12.4%" },
    { label: "Đơn hàng", value: String(orders.length || 342), icon: ShoppingBag, delta: "+8.1%" },
    { label: "Sản phẩm", value: String(products.length), icon: Package, delta: "+2" },
    { label: "Người dùng", value: "1,204", icon: Users, delta: "+15.2%" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Tổng quan</h1>
      <p className="mt-1 text-sm text-slate-500">Số liệu minh họa cho khu vực quản trị NEURALSTORE.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <s.icon size={18} />
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-success-600">
                <TrendingUp size={12} /> {s.delta}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-slate-200 bg-white p-6">
        <h2 className="mb-6 text-base font-semibold text-ink-900">Doanh thu theo tháng (triệu ₫)</h2>
        <div className="flex h-52 items-end gap-3">
          {revenueByMonth.map((r) => (
            <div key={r.month} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-sm bg-accent-500/80 transition-all hover:bg-accent-500"
                style={{ height: `${(r.value / maxRevenue) * 100}%` }}
                title={`${r.value} triệu ₫`}
              />
              <span className="text-xs text-slate-400">{r.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">Sản phẩm bán chạy</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {products.filter((p) => p.trending).slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <img src={p.images[0]} alt="" className="h-10 w-10 rounded-sm object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-ink-900">{p.name}</p>
                  <p className="text-xs text-slate-400">{formatVND(p.price)}</p>
                </div>
                <span className="text-xs font-semibold text-success-600">{p.rating}★</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">Đơn hàng gần đây</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có đơn hàng nào được tạo trong phiên này.</p>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-ink-900">#{o.id}</span>
                  <span className="text-slate-500">{o.status}</span>
                  <span className="font-semibold">{formatVND(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
