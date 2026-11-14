import client from "./axiosClient";
import { normalizeProduct } from "./normalizers";
import type { Cart } from "../types";
const normalizeCart = (raw: any): Cart => ({
  items: (raw?.items || []).map((item: any) => ({
    ...item,
    product: item.product ? normalizeProduct(item.product) : null,
  })),
});
export const cartApi = {
  getCart: async () => normalizeCart((await client.get("/cart")).data.data),
  addToCart: async (data: { product: string; sku: string; quantity: number }) =>
    normalizeCart((await client.post("/cart", data)).data.data),
  updateQuantity: async (data: {
    product: string;
    sku: string;
    quantity: number;
  }) => normalizeCart((await client.put("/cart", data)).data.data),
  removeItem: async (product: string, sku: string) =>
    normalizeCart(
      (await client.delete(`/cart/${product}`, { params: { sku } })).data.data,
    ),
  clearCart: async () =>
    normalizeCart((await client.delete("/cart")).data.data),
};
export default cartApi;
