import client from "./axiosClient";
import { normalizeOrder } from "./normalizers";
import type { Order, OrderStatus } from "../types";
export interface CreateOrderInput {
  items: { product: string; sku: string; quantity: number }[];
  shippingAddress: {
    name: string;
    phone: string;
    email: string;
    street: string;
    ward: string;
    district: string;
    province: string;
  };
  shippingMethod: "standard" | "express";
  paymentMethod: string;
}
export const orderApi = {
  create: async (input: CreateOrderInput, key: string): Promise<Order> =>
    normalizeOrder(
      (
        await client.post("/orders", input, {
          headers: { "Idempotency-Key": key },
        })
      ).data.data,
    ),
  list: async (admin = false): Promise<Order[]> => {
    const url = admin ? "/orders/admin" : "/orders/my-orders";
    const first = (await client.get(url, { params: { limit: 100 } })).data;
    const data = [...first.data];
    for (let page = 2; page <= first.pagination.totalPages; page++)
      data.push(
        ...(await client.get(url, { params: { limit: 100, page } })).data.data,
      );
    return data.map(normalizeOrder);
  },
  get: async (id: string, admin = false): Promise<Order> =>
    normalizeOrder(
      (
        await client.get(
          admin
            ? `/orders/admin/${id}`
            : `/orders/my-orders/${encodeURIComponent(id)}`,
        )
      ).data.data,
    ),
  cancel: async (id: string, reason: string): Promise<Order> =>
    normalizeOrder(
      (
        await client.put(`/orders/my-orders/${id}/cancel`, {
          cancelReason: reason,
        })
      ).data.data,
    ),
  updateStatus: async (
    id: string,
    status: OrderStatus,
    reason?: string,
  ): Promise<Order> =>
    normalizeOrder(
      (
        await client.put(`/orders/admin/${id}/status`, {
          orderStatus: status,
          cancelReason: reason,
        })
      ).data.data,
    ),
};
