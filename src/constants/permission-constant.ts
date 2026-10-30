import type { TPermissions } from "@/types/auth";

/** Permission titles the API returns in `GET /api/me` → `permissions[]`. */
export const PERMISSIONS_CONSTANT = {
  LEAVE_REQUEST: "leave.request",
  LEAVE_APPROVE: "leave.approve",
} as const;

export const DEFAULT_PERMISSIONS: TPermissions = Object.values(PERMISSIONS_CONSTANT).reduce(
  (acc, permission) => ({ ...acc, [permission]: false }),
  {} as TPermissions,
);
