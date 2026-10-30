import { create } from "zustand";

import type { TUser } from "@/types/auth";

type TAuthState = {
  user: TUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: TUser) => void;
  clear: () => void;
  setInitialized: (value: boolean) => void;
};

export const useAuthStore = create<TAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user) => set({ user, isAuthenticated: true }),
  clear: () => set({ user: null, isAuthenticated: false }),
  setInitialized: (value) => set({ isInitialized: value }),
}));
