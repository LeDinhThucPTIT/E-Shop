import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "../types";
import { generateOrderId } from "../utils/format";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
};

function buildTimeline(status: OrderStatus, createdAt: string): Order["timeline"] {
  const order: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered"];
  if (status === "cancelled") {
    return [
      { status: "pending", label: STATUS_LABELS.pending, timestamp: createdAt, done: true },
      { status: "cancelled", label: STATUS_LABELS.cancelled, timestamp: createdAt, done: true },
    ];
  }
  const currentIdx = order.indexOf(status);
  return order.map((s, i) => ({
    status: s,
    label: STATUS_LABELS[s],
    timestamp: createdAt,
    done: i <= currentIdx,
  }));
}

interface OrdersState {
  orders: Order[];
  createOrder: (order: Omit<Order, "id" | "createdAt" | "status" | "timeline" | "estimatedDelivery">) => Order;
  getOrder: (id: string) => Order | undefined;
  cancelOrder: (id: string) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      createOrder: (partial) => {
        const createdAt = new Date().toISOString();
        const days = partial.shippingMethod === "express" ? 2 : 5;
        const estimatedDelivery = new Date(
          Date.now() + days * 86400000
        ).toISOString();
        const status: OrderStatus = "pending";
        const order: Order = {
          ...partial,
          id: generateOrderId(),
          createdAt,
          status,
          estimatedDelivery,
          timeline: buildTimeline(status, createdAt),
        };
        set({ orders: [order, ...get().orders] });
        return order;
      },
      getOrder: (id) => get().orders.find((o) => o.id === id),
      cancelOrder: (id) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, status: "cancelled", timeline: buildTimeline("cancelled", o.createdAt) }
              : o
          ),
        })),
    }),
    { name: "neuralstore-orders" }
  )
);

export { STATUS_LABELS };
