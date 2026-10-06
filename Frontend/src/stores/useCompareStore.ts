import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_COMPARE = 4;

interface CompareState {
  productIds: string[];
  add: (productId: string) => boolean;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      add: (productId) => {
        const current = get().productIds;
        if (current.includes(productId)) return true;
        if (current.length >= MAX_COMPARE) return false;
        set({ productIds: [...current, productId] });
        return true;
      },
      remove: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    { name: "neuralstore-compare" }
  )
);

export { MAX_COMPARE };
