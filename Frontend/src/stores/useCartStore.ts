import { create } from "zustand";
import cartApi from "../services/cartApi";
import type { CartItem, Cart } from "../types";
export type { CartItem } from "../types";
import { errorMessage } from "../services/axiosClient";
import { useUIStore } from "./useUIStore";
let queue: Promise<unknown> = Promise.resolve();
let generation = 0;
interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string;
  fetchCart: () => Promise<void>;
  addItem: (
    productId: string,
    sku: string,
    quantity?: number,
  ) => Promise<boolean>;
  updateQuantity: (
    productId: string,
    sku: string,
    quantity: number,
  ) => Promise<boolean>;
  removeItem: (productId: string, sku: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  clearCartLocal: () => void;
  subtotal: () => number;
  totalItems: () => number;
}
export const itemPrice = (item: CartItem) =>
  item.product?.variants.find((v) => v.sku === item.sku)?.price ??
  item.product?.price ??
  0;
export const itemStock = (item: CartItem) =>
  item.product?.variants.find((v) => v.sku === item.sku)?.stock ??
  item.product?.stock ??
  0;
export const useCartStore = create<CartState>((set, get) => {
  const run = (task: () => Promise<Cart>, notify = false): Promise<boolean> => {
    const current = generation;
    set({ isLoading: true });
    const job = queue.then(async () => {
      if (current !== generation) return false;
      if (!localStorage.getItem("access_token")) {
        if (notify)
          useUIStore
            .getState()
            .showToast("Vui lòng đăng nhập để mua hàng", "warning");
        set({ isLoading: false });
        return false;
      }
      try {
        const cart = await task();
        if (current !== generation) return false;
        set({ items: cart.items, error: "", isLoading: false });
        return true;
      } catch (error) {
        if (current === generation) {
          const message = errorMessage(error);
          set({ error: message, isLoading: false });
          useUIStore.getState().showToast(message, "error");
        }
        return false;
      }
    });
    queue = job;
    return job;
  };
  return {
    items: [],
    isLoading: false,
    error: "",
    fetchCart: async () => {
      await run(() => cartApi.getCart());
    },
    addItem: (product, sku, quantity = 1) =>
      run(() => cartApi.addToCart({ product, sku, quantity }), true),
    updateQuantity: (product, sku, quantity) =>
      quantity <= 0
        ? get().removeItem(product, sku)
        : run(() => cartApi.updateQuantity({ product, sku, quantity })),
    removeItem: (product, sku) => run(() => cartApi.removeItem(product, sku)),
    clearCart: () => run(() => cartApi.clearCart()),
    clearCartLocal: () => {
      generation++;
      set({ items: [], error: "", isLoading: false });
    },
    subtotal: () =>
      get().items.reduce(
        (sum, item) => sum + itemPrice(item) * item.quantity,
        0,
      ),
    totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  };
});
