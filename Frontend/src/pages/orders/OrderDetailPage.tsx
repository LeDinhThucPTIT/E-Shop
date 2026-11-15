import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, XCircle } from "lucide-react";
import Container from "../../components/ui/Container";
import Breadcrumb from "../../components/ui/Breadcrumb";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useOrdersStore } from "../../stores/useOrdersStore";
import { formatVND, formatDate, formatDateTime } from "../../utils/format";
import { useUIStore } from "../../stores/useUIStore";
import { paymentApi } from '../../services/paymentApi';
import { errorMessage } from '../../services/axiosClient';

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  vnpay: "VNPay",
  momo: "MoMo",
  "bank-transfer": "Chuyển khoản ngân hàng",
};
const SHIPPING_LABELS: Record<string, string> = {
  standard: "Giao hàng tiêu chuẩn",
  express: "Giao hàng nhanh",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrder, cancelOrder, fetchOrder, isLoading, error } =
    useOrdersStore();
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  useEffect(() => {
    if (id) void fetchOrder(id);
  }, [id, fetchOrder]);
  const { showToast } = useUIStore();
  const order = id ? getOrder(id) : undefined;

  if (isLoading)
    return <Container className="py-16">Đang tải đơn hàng...</Container>;
  if (error)
    return (
      <Container className="py-16">
        <p role="alert">{error}</p>
        <button onClick={() => id && void fetchOrder(id)}>Thử lại</button>
      </Container>
    );
  if (!order) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<XCircle size={26} />}
          title="Không tìm thấy đơn hàng"
          actionLabel="Về danh sách đơn hàng"
          onAction={() => navigate("/orders")}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <Breadcrumb
        items={[
          { label: "Đơn hàng", to: "/orders" },
          { label: `#${order.id}` },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink-900">
          Đơn hàng #{order.id}
        </h1>
        {order.status === "pending" && (
          <Button
            variant="outline"
            disabled={cancelling}
            onClick={async () => {
              const reason = window.prompt("Lý do hủy đơn hàng");
              if (!reason?.trim()) return;
              setCancelling(true);
              const ok = await cancelOrder(order._id, reason);
              setCancelling(false);
              showToast(
                ok ? "Đã hủy đơn hàng" : useOrdersStore.getState().error,
                ok ? "info" : "error",
              );
            }}
          >
            Hủy đơn hàng
          </Button>
        )}
      </div>

      {order.paymentMethod === 'momo' && <div className="mt-6 rounded-xl border bg-white p-5">
        <p className="mb-3 font-medium" role="status">{order.paymentNeedsReview ? 'Giao dịch cần đối soát. Vui lòng liên hệ cửa hàng, không thanh toán thêm.' : order.paymentStatus === 'paid' ? 'Đã thanh toán qua MoMo' : order.paymentStatus === 'failed' ? 'Thanh toán chưa thành công' : 'Chờ thanh toán / xác nhận từ MoMo'}</p>
        {order.paymentExpiresAt && <p className="mb-3 text-sm text-slate-500">Hạn thanh toán: {formatDateTime(order.paymentExpiresAt)}</p>}
        <div className="flex gap-3">
          {order.status === 'pending' && order.paymentStatus !== 'paid' && !order.paymentNeedsReview && !!order.paymentExpiresAt && new Date(order.paymentExpiresAt).getTime() > Date.now() && <Button loading={paying} onClick={async () => {
            setPaying(true);
            try { const payment = await paymentApi.create(order._id); window.location.assign(payment.paymentUrl); }
            catch (err) { showToast(errorMessage(err), 'error'); setPaying(false); }
          }}>Thanh toán qua MoMo</Button>}
          <Button variant="outline" onClick={() => id && void fetchOrder(id)}>Cập nhật trạng thái</Button>
        </div>
      </div>}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Timeline */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-base font-semibold text-ink-900">
              Trạng thái đơn hàng
            </h2>
            <div className="flex flex-col gap-0">
              {order.timeline.map((event, i) => (
                <div key={event.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        event.done
                          ? event.status === "cancelled"
                            ? "bg-error-500 text-white"
                            : "bg-success-500 text-white"
                          : "border border-slate-200 text-slate-300"
                      }`}
                    >
                      {event.done ? <Check size={14} /> : null}
                    </div>
                    {i < order.timeline.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${event.done ? "bg-success-500" : "bg-slate-200"}`}
                        style={{ minHeight: 28 }}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-medium ${event.done ? "text-ink-900" : "text-slate-400"}`}
                    >
                      {event.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className="mt-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-ink-900">
              Sản phẩm
            </h2>
            <div className="flex flex-col divide-y divide-slate-100">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 py-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-sm object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      SL: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-ink-900">
              Thanh toán & Vận chuyển
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatVND(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vận chuyển</span>
                <span>
                  {order.shipping === 0
                    ? "Miễn phí"
                    : formatVND(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Thuế</span>
                <span>{formatVND(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-ink-900">
                <span>Tổng cộng</span>
                <span>{formatVND(order.total)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <p>
                <span className="text-slate-400">Thanh toán: </span>
                {PAYMENT_LABELS[order.paymentMethod]}
              </p>
              <p>
                <span className="text-slate-400">Vận chuyển: </span>
                {SHIPPING_LABELS[order.shippingMethod]}
              </p>
              <p>
                <span className="text-slate-400">Dự kiến giao: </span>
                {formatDate(order.estimatedDelivery)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-ink-900">
              Địa chỉ giao hàng
            </h2>
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-medium text-ink-900">
                {order.address.fullName}
              </p>
              <p>{order.address.phone}</p>
              <p>{order.address.email}</p>
              <p>
                {order.address.address}, {order.address.ward},{" "}
                {order.address.district}, {order.address.city}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
