import { z } from "zod";

/**
 * Setup module schemas (docs/setup-module.md §3–§6). Each drives both the dialog's `zodResolver`
 * and the action's `safeParse`; ids travel as strings ("" = none / create).
 */

export const ACTIVE_STATUSES = ["active", "inactive"] as const;
export const EMPLOYMENT_TYPES = ["permanent", "contract", "probation", "intern"] as const;

const optionalId = z.string().regex(/^\d*$/);

export const setupDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/* --------------------------------- Users --------------------------------- */

export const userSchema = z
  .object({
    id: optionalId,
    name: z.string().trim().min(1, "setup.users.validation.nameRequired").max(255, "setup.users.validation.nameMax"),
    email: z.string().trim().min(1, "setup.users.validation.emailRequired").pipe(z.email("setup.users.validation.emailInvalid")),
    password: z.string(),
    password_confirmation: z.string(),
    role_id: z.string().min(1, "setup.users.validation.roleRequired"),
    employee_id: optionalId,
    is_active: z.boolean(),
  })
  .superRefine((value, context) => {
    const isCreate = !value.id;

    if (isCreate && !value.password) {
      context.addIssue({ code: "custom", path: ["password"], message: "setup.users.validation.passwordRequired" });
      return;
    }

    if (value.password && value.password.length < 8) {
      context.addIssue({ code: "custom", path: ["password"], message: "setup.users.validation.passwordMin" });
    }

    if (value.password && value.password !== value.password_confirmation) {
      context.addIssue({ code: "custom", path: ["password_confirmation"], message: "setup.users.validation.passwordMismatch" });
    }
  });

export type UserSchemaType = z.infer<typeof userSchema>;

/* ------------------------------- Employees ------------------------------- */

export const employeeSchema = z
  .object({
    id: optionalId,
    employee_number: z
      .string()
      .trim()
      .min(1, "setup.employees.validation.employeeNumberRequired")
      .max(50, "setup.employees.validation.employeeNumberMax"),
    name: z.string().trim().min(1, "setup.employees.validation.nameRequired").max(255, "setup.employees.validation.nameMax"),
    email: z.union([z.literal(""), z.email("setup.employees.validation.emailInvalid")]),
    phone_number: z
      .string()
      .trim()
      .regex(/^(\+?[0-9][0-9\s-]{7,19})?$/, "setup.employees.validation.phoneInvalid"),
    position: z.string().trim().max(255, "setup.employees.validation.positionMax"),
    department_id: optionalId,
    supervisor_id: optionalId,
    join_date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "setup.employees.validation.joinDateInvalid"),
    employment_type: z.enum(EMPLOYMENT_TYPES, "setup.employees.validation.employmentTypeRequired"),
    status: z.enum(ACTIVE_STATUSES, "setup.employees.validation.statusRequired"),
  })
  .refine((value) => !value.id || !value.supervisor_id || value.id !== value.supervisor_id, {
    path: ["supervisor_id"],
    message: "setup.employees.validation.supervisorSelf",
  });

export type EmployeeSchemaType = z.infer<typeof employeeSchema>;

/* ------------------------------ Departments ------------------------------ */

export const departmentSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1, "setup.departments.validation.nameRequired").max(255, "setup.departments.validation.nameMax"),
  alias: z.string().trim().min(1, "setup.departments.validation.aliasRequired").max(50, "setup.departments.validation.aliasMax"),
});

export type DepartmentSchemaType = z.infer<typeof departmentSchema>;

/* --------------------------------- Roles --------------------------------- */

export const roleSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1, "setup.roles.validation.titleRequired").max(100, "setup.roles.validation.titleMax"),
  description: z.string().trim().max(255, "setup.roles.validation.descriptionMax"),
  permission_ids: z.array(z.number().int().positive()).min(1, "setup.roles.validation.permissionsRequired"),
});

export type RoleSchemaType = z.infer<typeof roleSchema>;

/* ------------------------------ Permissions ------------------------------ */

export const permissionSchema = z.object({
  id: optionalId,
  title: z
    .string()
    .trim()
    .min(1, "setup.permissions.validation.titleRequired")
    .regex(/^[a-z_]+\.[a-z_]+$/, "setup.permissions.validation.titleFormat"),
  label: z.string().trim().min(1, "setup.permissions.validation.labelRequired").max(255, "setup.permissions.validation.labelMax"),
  group_name: z
    .string()
    .trim()
    .min(1, "setup.permissions.validation.groupRequired")
    .max(50, "setup.permissions.validation.groupMax"),
});

export type PermissionSchemaType = z.infer<typeof permissionSchema>;

/* --------------------------- Annual leave balance -------------------------- */

export const leaveBalanceSchema = z.object({
  employee_id: z.number().int().positive(),
  balance: z
    .number({ message: "setup.leaveBalances.validation.balanceRequired" })
    .min(-365, "setup.leaveBalances.validation.balanceRange")
    .max(365, "setup.leaveBalances.validation.balanceRange")
    .refine((value) => Number.isInteger(value * 2), "setup.leaveBalances.validation.balanceStep"),
  note: z
    .string()
    .trim()
    .min(3, "setup.leaveBalances.validation.noteRequired")
    .max(255, "setup.leaveBalances.validation.noteMax"),
});

export type LeaveBalanceSchemaType = z.infer<typeof leaveBalanceSchema>;
