import { create } from "zustand";
import type { Order } from "../types";
import { orderApi, type CreateOrderInput } from "../services/orderApi";
import { errorMessage } from "../services/axiosClient";
export { STATUS_LABELS } from "../services/normalizers";
let generation = 0;
interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string;
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  createOrder: (input: CreateOrderInput, key: string) => Promise<Order>;
  getOrder: (id: string) => Order | undefined;
  cancelOrder: (id: string, reason: string) => Promise<boolean>;
  clear: () => void;
}
export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: "",
  clear: () => {
    generation++;
    set({ orders: [], error: "", isLoading: false });
  },
  fetchOrders: async () => {
    const current = generation;
    set({ isLoading: true, error: "" });
    try {
      const orders = await orderApi.list();
      if (current === generation) set({ orders, isLoading: false });
    } catch (error) {
      if (current === generation)
        set({ error: errorMessage(error), isLoading: false });
    }
  },
  fetchOrder: async (id) => {
    const current = generation;
    set({ isLoading: true, error: "" });
    try {
      const order = await orderApi.get(id);
      if (current === generation)
        set({
          orders: [order, ...get().orders.filter((o) => o.id !== order.id)],
          isLoading: false,
        });
    } catch (error) {
      if (current === generation)
        set({ error: errorMessage(error), isLoading: false });
    }
  },
  createOrder: async (input, key) => {
    const current = generation;
    const order = await orderApi.create(input, key);
    if (current !== generation) throw new Error("Phiên đăng nhập đã thay đổi");
    set({ orders: [order, ...get().orders.filter((o) => o.id !== order.id)] });
    return order;
  },
  getOrder: (id) => get().orders.find((o) => o.id === id || o._id === id),
  cancelOrder: async (id, reason) => {
    const current = generation;
    try {
      const order = await orderApi.cancel(id, reason);
      if (current !== generation) return false;
      set({
        orders: get().orders.map((o) => (o._id === order._id ? order : o)),
        error: "",
      });
      return true;
    } catch (error) {
      if (current === generation) set({ error: errorMessage(error) });
      return false;
    }
  },
}));
window.addEventListener("auth:cleared", () =>
  useOrdersStore.getState().clear(),
);
