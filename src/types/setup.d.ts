/**
 * Setup module (docs/setup-module.md §3–§7): users, employees, departments, roles, permissions.
 */

export type TSortDirection = "asc" | "desc";

export type TActiveStatus = "active" | "inactive";

export type TEmploymentType = "permanent" | "contract" | "probation" | "intern";

/** `/api/dropdown/*` row: `{ id, text }` plus the extras each endpoint adds. */
export type TOption<TExtra extends object = object> = {
  id: number;
  text: string;
} & TExtra;

export type TDepartmentOption = TOption<{ alias?: string | null }>;

/** `email` is not in the contract's extras; it is used to prefill the user form when the API sends it. */
export type TEmployeeOption = TOption<{ employee_number?: string; email?: string | null }>;

export type TDepartmentRef = { id: number; name: string; alias: string };

export type TRoleRef = { id: number; title: string };

/* --------------------------------- Users --------------------------------- */

export type TUserItem = {
  id: number;
  name: string;
  email: string;
  status: TActiveStatus;
  created_at: string;
  role: TRoleRef | null;
  employee: {
    id: number;
    employee_number: string;
    name: string;
    position: string | null;
    department: TDepartmentRef | null;
  } | null;
};

export type TUserSortKey = "name" | "email" | "created_at";

export type TUserListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  status?: TActiveStatus;
  role_id?: number | string;
  sort_by?: TUserSortKey;
  sort_dir?: TSortDirection;
};

export type TUserPayload = {
  name: string;
  email: string;
  /** Required on create; omitted on update to keep the current password. */
  password?: string;
  role_id: number;
  employee_id: number | null;
  status: TActiveStatus;
};

/* ------------------------------- Employees ------------------------------- */

export type TEmployeeItem = {
  id: number;
  employee_number: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  position: string | null;
  join_date: string | null;
  employment_type: TEmploymentType;
  status: TActiveStatus;
  created_at: string;
  department: TDepartmentRef | null;
  supervisor: { id: number; name: string; employee_number: string } | null;
  user: { id: number; email: string; role: TRoleRef | null } | null;
};

export type TEmployeeSortKey = "name" | "employee_number" | "join_date" | "created_at";

export type TEmployeeListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  department_id?: number | string;
  status?: TActiveStatus;
  employment_type?: TEmploymentType;
  sort_by?: TEmployeeSortKey;
  sort_dir?: TSortDirection;
};

export type TEmployeePayload = {
  employee_number: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  position: string | null;
  department_id: number | null;
  supervisor_id: number | null;
  /** `Y-m-d`. */
  join_date: string | null;
  employment_type: TEmploymentType;
  status: TActiveStatus;
};

export type TEmployeeOptionParams = {
  search?: string;
  /** `1` hides employees that already have a user, except `include_id`. */
  unlinked?: 0 | 1;
  include_id?: number;
  exclude_id?: number;
};

/* ------------------------------ Departments ------------------------------ */

export type TDepartmentItem = {
  id: number;
  name: string;
  alias: string;
  employees_count: number;
  created_at: string;
};

export type TDepartmentSortKey = "name" | "alias" | "created_at";

export type TDepartmentListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: TDepartmentSortKey;
  sort_dir?: TSortDirection;
};

export type TDepartmentPayload = {
  name: string;
  alias: string;
};

/* --------------------------------- Roles --------------------------------- */

export type TRoleItem = {
  id: number;
  title: string;
  description: string | null;
  is_system: boolean;
  users_count: number;
  permission_ids: number[];
  permissions: { id: number; title: string; label: string }[];
  created_at: string;
};

export type TRoleDetail = TRoleItem & {
  users: { id: number; name: string; email: string }[];
};

export type TRoleListParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

export type TRolePayload = {
  title: string;
  description: string | null;
  permission_ids: number[];
};

/* ------------------------------ Permissions ------------------------------ */

export type TPermissionItem = {
  id: number;
  title: string;
  label: string;
  group_name: string;
  is_system: boolean;
  roles_count: number;
  created_at: string;
};

export type TPermissionGroup = {
  group_name: string;
  permissions: TPermissionItem[];
};

export type TPermissionListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  group_name?: string;
};

export type TPermissionPayload = {
  title: string;
  label: string;
  group_name: string;
};
