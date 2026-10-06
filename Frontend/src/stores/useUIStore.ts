import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UIState {
  theme: "light" | "dark";
  toggleTheme: () => void;
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isFilterDrawerOpen: boolean;
  setFilterDrawerOpen: (open: boolean) => void;
  isAIDrawerOpen: boolean;
  setAIDrawerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
  toasts: [],
  showToast: (message, type = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  isFilterDrawerOpen: false,
  setFilterDrawerOpen: (open) => set({ isFilterDrawerOpen: open }),
  isAIDrawerOpen: false,
  setAIDrawerOpen: (open) => set({ isAIDrawerOpen: open }),
}));
