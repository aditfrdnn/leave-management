import type { PERMISSIONS_CONSTANT } from "@/constants/permission-constant";

export type TPermission = (typeof PERMISSIONS_CONSTANT)[keyof typeof PERMISSIONS_CONSTANT];

export type TPermissions = Record<TPermission, boolean>;

export type TUser = {
  id: number;
  name: string;
  email: string;
  phone_number?: string | null;
  status?: string;
  department?: {
    id: number;
    name: string;
    alias: string;
  } | null;
  /** Permission titles from `GET /api/me`; the login response has none until the next bootstrap. */
  permissions?: string[];
};

/** `POST /api/auth/login` → `data`: the user with its bearer token on the same object. */
export type TLoginData = TUser & { token: string };

export type AuthFormState = {
  status?: string;
  redirect?: string;
  user?: TUser;
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};
