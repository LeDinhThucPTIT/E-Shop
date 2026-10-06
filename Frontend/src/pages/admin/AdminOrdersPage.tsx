import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrdersStore, STATUS_LABELS } from "../../stores/useOrdersStore";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { PackageSearch } from "lucide-react";
import { formatVND, formatDate } from "../../utils/format";
import type { OrderStatus } from "../../types";

const STATUS_VARIANT: Record<OrderStatus, "default" | "accent" | "success" | "warning" | "error" | "info"> = {
  pending: "warning", confirmed: "info", shipping: "accent", delivered: "success", cancelled: "error",
};

export default function AdminOrdersPage() {
  const { orders } = useOrdersStore();
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Quản lý đơn hàng</h1>
      <p className="mt-1 text-sm text-slate-500">{orders.length} đơn hàng được tạo trong phiên này</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!statusFilter ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-200 text-slate-600"}`}
        >
          Tất cả
        </button>
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${statusFilter === s ? "border-accent-500 bg-accent-50 text-accent-600" : "border-slate-200 text-slate-600"}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<PackageSearch size={24} />} title="Không có đơn hàng nào" description="Đơn hàng được tạo từ trang thanh toán sẽ hiển thị tại đây." />
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 text-left text-xs font-semibold uppercase text-slate-400">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="p-3 font-medium text-ink-900">#{o.id}</td>
                  <td className="p-3 text-slate-600">{formatDate(o.createdAt)}</td>
                  <td className="p-3"><Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABELS[o.status]}</Badge></td>
                  <td className="p-3 font-semibold">{formatVND(o.total)}</td>
                  <td className="p-3 text-right">
                    <Link to={`/orders/${o.id}`} className="text-xs font-semibold text-accent-600 hover:underline">Xem</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
