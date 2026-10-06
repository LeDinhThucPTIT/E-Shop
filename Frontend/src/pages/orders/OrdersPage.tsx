import { Link, useNavigate } from "react-router-dom";
import { PackageX, ChevronRight } from "lucide-react";
import Container from "../../components/ui/Container";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import { useOrdersStore, STATUS_LABELS } from "../../stores/useOrdersStore";
import { formatVND, formatDate } from "../../utils/format";
import type { OrderStatus } from "../../types";

const STATUS_VARIANT: Record<OrderStatus, "default" | "accent" | "success" | "warning" | "error" | "info"> = {
  pending: "warning",
  confirmed: "info",
  shipping: "accent",
  delivered: "success",
  cancelled: "error",
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders } = useOrdersStore();

  if (orders.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<PackageX size={26} />}
          title="Bạn chưa có đơn hàng nào"
          description="Khi bạn đặt hàng, đơn hàng sẽ xuất hiện tại đây."
          actionLabel="Khám phá sản phẩm"
          onAction={() => navigate("/products")}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Đơn hàng của tôi</h1>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-violet-300 hover:shadow-md sm:flex-row sm:items-center"
          >
            <div className="flex -space-x-3">
              {order.items.slice(0, 3).map((item, i) => (
                <img
                  key={i}
                  src={item.image}
                  alt=""
                  className="h-14 w-14 rounded-md border-2 border-white object-cover"
                />
              ))}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink-900">#{order.id}</p>
                <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABELS[order.status]}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {order.items.length} sản phẩm • Đặt ngày {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-base font-bold text-ink-900">{formatVND(order.total)}</span>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
