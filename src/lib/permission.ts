import { useAuthStore } from "@/stores";
import type { TPermission } from "@/types/auth";

/** Permission check against the signed-in user (`permissions[]` from `GET /api/me`). */
export function usePermission(permission: TPermission | string) {
  const permissions = useAuthStore((state) => state.permissions);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) return { loading: true, allowed: false };

  return { loading: false, allowed: permissions?.[permission as TPermission] ?? false };
}

/** Every permission title of the signed-in user, for menus that filter by title. */
export function usePermissionTitles() {
  const permissions = useAuthStore((state) => state.permissions);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  const titles = permissions
    ? (Object.entries(permissions).filter(([, allowed]) => allowed).map(([title]) => title) as string[])
    : [];

  return { data: titles, loading: !isInitialized };
}
