import { create } from "zustand";

import { DEFAULT_PERMISSIONS, PERMISSIONS_CONSTANT } from "@/constants/permission-constant";
import type { TPermissions, TUser } from "@/types/auth";

type TAuthState = {
  user: TUser | null;
  permissions: TPermissions | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: TUser) => void;
  clear: () => void;
  setInitialized: (value: boolean) => void;
};

/**
 * `permissions[]` is a list of titles; the store keeps it as a `title → boolean` map. Login's
 * response has no list yet, so every signed-in user gets `leave.request` until `/api/me` answers.
 */
function toPermissionMap(user: TUser): TPermissions {
  const titles: string[] = user.permissions ?? [PERMISSIONS_CONSTANT.LEAVE_REQUEST];

  return titles.reduce<TPermissions>((acc, permission) => ({ ...acc, [permission]: true }), { ...DEFAULT_PERMISSIONS });
}

export const useAuthStore = create<TAuthState>((set) => ({
  user: null,
  permissions: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (user) => set({ user, permissions: toPermissionMap(user), isAuthenticated: true }),
  clear: () => set({ user: null, permissions: DEFAULT_PERMISSIONS, isAuthenticated: false }),
  setInitialized: (value) => set({ isInitialized: value }),
}));
