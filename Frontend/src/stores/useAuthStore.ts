import { create } from "zustand";
import client, { errorMessage } from "../services/axiosClient";
import type { User } from "../types";
import { useCartStore } from "./useCartStore";
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  register: (
    fullName: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  refresh: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  logout: () => void;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: !!localStorage.getItem("access_token"),
  login: async (email, password) => {
    try {
      const { data } = await client.post("/users/login", { email, password });
      useCartStore.getState().clearCartLocal();
      window.dispatchEvent(new Event("auth:cleared"));
      localStorage.setItem("access_token", data.token);
      set({ user: data.userData, isAuthenticated: true, isLoading: false });
      await useCartStore.getState().fetchCart();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  register: async (fullName, email, password, phone) => {
    try {
      await client.post("/users/register", {
        fullName,
        email,
        password,
        phone,
      });
      return get().login(email, password);
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  },
  refresh: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await client.get("/users/me");
      if (token !== localStorage.getItem("access_token")) return;
      set({ user: data, isAuthenticated: true, isLoading: false });
      await useCartStore.getState().fetchCart();
    } catch {
      if (token === localStorage.getItem("access_token")) get().logout();
    }
  },
  updateProfile: async (input) => {
    const token = localStorage.getItem("access_token");
    try {
      const { data } = await client.put("/users/me", input);
      if (token !== localStorage.getItem("access_token")) return false;
      set({ user: data });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("neuralstore-auth");
    sessionStorage.removeItem("checkout-intent");
    useCartStore.getState().clearCartLocal();
    window.dispatchEvent(new Event("auth:cleared"));
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
window.addEventListener("auth:expired", () => useAuthStore.getState().logout());
