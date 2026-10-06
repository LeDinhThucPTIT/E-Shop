import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Package, Truck, CreditCard } from "lucide-react";
import { useEffect } from "react";
import Container from "../../components/ui/Container";
import Button from "../../components/ui/Button";
import { useOrdersStore } from "../../stores/useOrdersStore";
import { formatVND, formatDate } from "../../utils/format";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng",
  vnpay: "VNPay",
  momo: "MoMo",
  "bank-transfer": "Chuyển khoản ngân hàng",
};

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = (location.state as { orderId?: string })?.orderId;
  const { getOrder } = useOrdersStore();
  const order = orderId ? getOrder(orderId) : undefined;

  useEffect(() => {
    if (!order) navigate("/orders", { replace: true });
  }, [order, navigate]);

  if (!order) return null;

  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-50 animate-scaleIn">
          <CheckCircle2 size={40} className="text-success-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-ink-900">Đặt hàng thành công!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Cảm ơn bạn đã mua sắm tại NEURALSTORE. Mã đơn hàng của bạn là:
        </p>
        <p className="mt-1 text-lg font-bold text-accent-600">#{order.id}</p>

        <div className="mt-8 space-y-4 rounded-md border border-slate-200 p-5 text-left">
          <div className="flex items-center gap-3">
            <Package size={18} className="text-slate-400" />
            <div className="flex-1 text-sm">
              <p className="text-slate-500">Sản phẩm</p>
              <p className="font-medium text-ink-900">{order.items.length} sản phẩm — {formatVND(order.total)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-slate-400" />
            <div className="flex-1 text-sm">
              <p className="text-slate-500">Dự kiến giao hàng</p>
              <p className="font-medium text-ink-900">{formatDate(order.estimatedDelivery)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-slate-400" />
            <div className="flex-1 text-sm">
              <p className="text-slate-500">Phương thức thanh toán</p>
              <p className="font-medium text-ink-900">{PAYMENT_LABELS[order.paymentMethod]}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to={`/orders/${order.id}`} className="flex-1">
            <Button fullWidth variant="outline">Xem đơn hàng</Button>
          </Link>
          <Link to="/products" className="flex-1">
            <Button fullWidth>Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
