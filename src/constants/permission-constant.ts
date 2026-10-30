import type { TPermissions } from "@/types/auth";

/**
 * Permission titles the API returns in `GET /api/me` → `permissions[]` (leave-service
 * `PermissionSeeder`, catalog in `docs/setup-module.md` §2).
 */
export const PERMISSIONS_CONSTANT = {
  LEAVE_REQUEST: "leave.request",
  LEAVE_APPROVE: "leave.approve",
  LEAVE_VIEW_ALL: "leave.view_all",
  LEAVE_MANAGE_BALANCE: "leave.manage_balance",
  EMPLOYEES_MANAGE: "employees.manage",
  DEPARTMENTS_MANAGE: "departments.manage",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
} as const;

export const DEFAULT_PERMISSIONS: TPermissions = Object.values(PERMISSIONS_CONSTANT).reduce(
  (acc, permission) => ({ ...acc, [permission]: false }),
  {} as TPermissions,
);
