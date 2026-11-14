import { create } from "zustand";
import productApi from "../services/productApi";
import { categoryApi } from "../services/categoryApi";
import type { Product, Category } from "../types";
import { errorMessage } from "../services/axiosClient";
interface CatalogState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
}
let pending: Promise<void> | null = null;
export const useCatalogStore = create<CatalogState>((set) => ({
  products: [],
  categories: [],
  loading: true,
  error: "",
  load: () => {
    if (pending) return pending;
    pending = (async () => {
      set({ loading: true, error: "" });
      try {
        const [first, categories] = await Promise.all([
          productApi.getAll({ limit: 100 }),
          categoryApi.getAll({ isActive: true }),
        ]);
        const products = [...first.data];
        for (let page = 2; page <= first.pagination.totalPages; page++)
          products.push(
            ...(await productApi.getAll({ page, limit: 100 })).data,
          );
        set({ products, categories, loading: false });
      } catch (error) {
        set({ error: errorMessage(error), loading: false });
      }
    })().finally(() => {
      pending = null;
    });
    return pending;
  },
}));
export const getProductById = (id: string) =>
  useCatalogStore.getState().products.find((p) => p.id === id);
