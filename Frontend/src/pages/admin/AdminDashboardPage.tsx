import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";
import { errorMessage } from "../../services/axiosClient";
import { formatVND } from "../../utils/format";
import { STATUS_LABELS } from "../../services/normalizers";
import type { OrderStatus } from "../../types";
interface Stats {
  orders: number;
  users: number;
  products: number;
  revenue: number;
  monthly: { _id: string; total: number }[];
  recent: {
    _id: string;
    orderCode: string;
    totalPrice: number;
    orderStatus: OrderStatus;
  }[];
  bestsellers: {
    _id: string;
    name: string;
    soldCount: number;
    images: string[];
  }[];
}
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const load = async () => {
    setError("");
    try {
      setStats(await adminApi.stats());
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  useEffect(() => {
    void load();
  }, []);
  if (error)
    return (
      <p role="alert">
        {error} <button onClick={() => void load()}>Thử lại</button>
      </p>
    );
  if (!stats) return <p>Đang tải thống kê...</p>;
  const max = Math.max(1, ...stats.monthly.map((m) => m.total));
  return (
    <div>
      <h1 className="text-2xl font-bold">Tổng quan</h1>
      <p className="mt-2 text-sm text-slate-500">
        Doanh thu tính từ các đơn đã thanh toán.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Doanh thu", formatVND(stats.revenue)],
          ["Đơn hàng", stats.orders],
          ["Sản phẩm đang bán", stats.products],
          ["Người dùng", stats.users],
        ].map(([label, value]) => (
          <div key={label} className="rounded border bg-white p-5">
            <p className="text-2xl font-bold">{value}</p>
            <p>{label}</p>
          </div>
        ))}
      </div>
      <section className="mt-6 rounded border bg-white p-5">
        <h2 className="font-bold">Doanh thu theo tháng</h2>
        {!stats.monthly.length ? (
          <p className="mt-3">Chưa có đơn đã thanh toán.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {stats.monthly.map((m) => (
              <div key={m._id}>
                <p className="text-sm">
                  {m._id} — {formatVND(m.total)}
                </p>
                <div
                  className="h-4 rounded bg-violet-500"
                  style={{ width: `${(m.total / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded border bg-white p-5">
          <h2 className="font-bold">Sản phẩm bán chạy</h2>
          {stats.bestsellers.map((p) => (
            <div
              key={p._id}
              className="flex justify-between border-b py-3 text-sm"
            >
              <span>{p.name}</span>
              <span>{p.soldCount} đã bán</span>
            </div>
          ))}
        </section>
        <section className="rounded border bg-white p-5">
          <h2 className="font-bold">Đơn hàng gần đây</h2>
          {stats.recent.map((o) => (
            <div key={o._id} className="border-b py-3 text-sm">
              <p>{o.orderCode}</p>
              <p>
                {STATUS_LABELS[o.orderStatus] || o.orderStatus} •{" "}
                {formatVND(o.totalPrice)}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
