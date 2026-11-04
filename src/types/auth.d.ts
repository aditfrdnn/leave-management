import type { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";

export type TPermission = (typeof PERMISSIONS_CONSTANT)[keyof typeof PERMISSIONS_CONSTANT];

export type TPermissions = Record<TPermission, boolean>;

export type TUser = {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  status?: string;
  department?: {
    id: string;
    name: string;
    alias: string;
  } | null;
  /** HR Lite roles, set in the IAM Portal. */
  roles?: { id: string; key: string | null; title: string }[];
  /** Permission titles from `GET /api/me`, what the roles above allow. */
  permissions?: string[];
};
