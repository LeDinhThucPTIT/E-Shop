import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (fullName: string, email: string, _password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, _password) => {
        // Mock authentication — frontend only, no real backend.
        await new Promise((r) => setTimeout(r, 700));
        if (!email.includes("@")) {
          return { ok: false, message: "Email không hợp lệ." };
        }
        set({
          user: {
            id: "user-mock-1",
            fullName: email.split("@")[0].replace(/[._]/g, " "),
            email,
          },
          isAuthenticated: true,
        });
        return { ok: true };
      },
      register: async (fullName, email, _password) => {
        await new Promise((r) => setTimeout(r, 700));
        if (!email.includes("@")) {
          return { ok: false, message: "Email không hợp lệ." };
        }
        set({
          user: { id: "user-mock-1", fullName, email },
          isAuthenticated: true,
        });
        return { ok: true };
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "neuralstore-auth" }
  )
);
