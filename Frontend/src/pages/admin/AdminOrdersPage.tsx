import { useEffect, useState } from "react";
import { orderApi } from "../../services/orderApi";
import { STATUS_LABELS } from "../../services/normalizers";
import { errorMessage } from "../../services/axiosClient";
import { formatVND, formatDate } from "../../utils/format";
import type { Order, OrderStatus } from "../../types";
import Modal from "../../components/ui/Modal";
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await orderApi.list(true));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["shipping", "cancelled"],
    shipping: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  const change = async (o: Order, status: OrderStatus) => {
    const reason =
      status === "cancelled" ? window.prompt("Lý do hủy đơn hàng") : undefined;
    if (status === "cancelled" && !reason?.trim()) return;
    setBusy(o.id);
    setError("");
    try {
      const next = await orderApi.updateStatus(
        o._id,
        status,
        reason || undefined,
      );
      setOrders((rows) => rows.map((r) => (r.id === next.id ? next : r)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy("");
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      <select
        className="my-5 rounded border p-2"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="">Tất cả</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      {loading && <p>Đang tải...</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => void load()}>Thử lại</button>
        </p>
      )}
      <div className="overflow-auto rounded border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Mã đơn",
                "Ngày đặt",
                "Tổng tiền",
                "Trạng thái",
                "Thanh toán",
                "Thao tác",
              ].map((s) => (
                <th key={s} className="p-3">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders
              .filter((o) => !filter || o.status === filter)
              .map((o) => (
                <tr key={o.id}>
                  <td className="p-3">
                    <button
                      className="text-violet-600"
                      onClick={() => setSelected(o)}
                    >
                      {o.id}
                    </button>
                  </td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>{formatVND(o.total)}</td>
                  <td>{STATUS_LABELS[o.status] || o.status}</td>
                  <td>{o.paymentMethod.toUpperCase()} · {o.paymentNeedsReview ? 'Cần đối soát' : ({ pending: 'Chờ thanh toán', paid: 'Đã thanh toán', failed: 'Thất bại', refunded: 'Đã hoàn tiền' }[o.paymentStatus || 'pending'])}</td>
                  <td>
                    {(transitions[o.status] || []).map((s) => (
                      <button
                        key={s}
                        disabled={!!busy}
                        className="m-1 rounded border p-2"
                        onClick={() => void change(o, s)}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Chi tiết đơn hàng"
      >
        {selected && (
          <div>
            <p>{selected.id}</p>
            <p>
              {selected.address.fullName} • {selected.address.phone}
            </p>
            <p>
              {selected.address.address}, {selected.address.ward},{" "}
              {selected.address.district}, {selected.address.city}
            </p>
            {selected.items.map((i) => (
              <p key={i.productId + ":" + i.sku} className="mt-3">
                {i.name} • {i.sku} × {i.quantity} —{" "}
                {formatVND(i.price * i.quantity)}
              </p>
            ))}
            <p className="mt-4 font-bold">Tổng: {formatVND(selected.total)}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
