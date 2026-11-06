"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { setupService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type {
  TDepartmentOption,
  TEmployeeAccount,
  TEmployeeBulkInvitation,
  TEmployeeCareer,
  TEmployeeCareerPayload,
  TEmployeeCareerResult,
  TEmployeeItem,
  TEmployeeListParams,
  TEmployeeOption,
  TEmployeeOptionParams,
  TEmployeePayload,
  TEmployeeSaveResult,
} from "@/types/setup";
import {
  employeeCareerDeleteSchema,
  employeeCareerSchema,
  employeeSchema,
  setupDeleteSchema,
} from "@/validations/setup-validations";

type EmployeeActionState = ActionState<TEmployeeSaveResult>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

/** "" = none. Ids stay UUID strings; the grade is a number. */
const toNullableId = (value: string) => value || null;
const toNullableGrade = (value: string) => (value ? Number(value) : null);

export async function GetEmployees(params: TEmployeeListParams): Promise<TApiPaginated<TEmployeeItem>> {
  try {
    return await setupService.getEmployees(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("employees.errors.loadList")));
  }
}

export async function GetDepartmentOptions(): Promise<TDepartmentOption[]> {
  try {
    const response = await setupService.getDepartmentOptions();

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("shared.errors.loadDepartments")));
  }
}

/** Supervisor candidates; `exclude_id` keeps the edited employee out of its own list. */
export async function GetEmployeeOptions(params: TEmployeeOptionParams): Promise<TEmployeeOption[]> {
  try {
    const response = await setupService.getEmployeeOptions(params);

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("shared.errors.loadEmployees")));
  }
}

async function saveEmployee(formData: FormData | null, isUpdate: boolean): Promise<EmployeeActionState> {
  const t = await getTranslations("setup");

  if (!formData) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = employeeSchema.safeParse({
    id: getText(formData, "id"),
    employee_number: getText(formData, "employee_number"),
    name: getText(formData, "name"),
    email: getText(formData, "email"),
    phone_number: getText(formData, "phone_number"),
    position: getText(formData, "position"),
    grade: getText(formData, "grade"),
    department_id: getText(formData, "department_id"),
    supervisor_id: getText(formData, "supervisor_id"),
    join_date: getText(formData, "join_date"),
    employment_type: getText(formData, "employment_type"),
    status: getText(formData, "status"),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, ...values } = parsed.data;

  if (isUpdate && !id) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  // The API normalises the phone number to `62…`; empty optional fields go as null.
  const payload: TEmployeePayload = {
    employee_number: values.employee_number,
    name: values.name,
    email: values.email || null,
    phone_number: values.phone_number ? values.phone_number.replace(/[\s-]/g, "") : null,
    supervisor_id: toNullableId(values.supervisor_id),
    join_date: values.join_date || null,
    status: values.status,
  };

  // Position, employment type, department and grade seed the first career row; after that they
  // change only through career rows (docs/setup-module.md §14), so an update leaves them out.
  if (!isUpdate) {
    payload.position = values.position || null;
    payload.department_id = toNullableId(values.department_id);
    payload.employment_type = values.employment_type;
    payload.grade = toNullableGrade(values.grade);
  }

  try {
    const result = isUpdate ? await setupService.updateEmployee(id, payload) : await setupService.createEmployee(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, isUpdate ? t("employees.errors.update") : t("employees.errors.create"));
  }
}

export async function CreateEmployee(prevState: EmployeeActionState, formData: FormData | null): Promise<EmployeeActionState> {
  return saveEmployee(formData, false);
}

export async function UpdateEmployee(prevState: EmployeeActionState, formData: FormData | null): Promise<EmployeeActionState> {
  return saveEmployee(formData, true);
}

/** Deletes the employee; one with an account is archived instead (the API says which in its message). */
export async function DeleteEmployee(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = setupDeleteSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.deleteEmployee(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("employees.errors.delete"));
  }
}

/**
 * A fresh IAM activation link for the employee (the previous one stops working); the API sends it on
 * WhatsApp when the employee has a phone number, otherwise HR copies `invitation.message`.
 */
export async function SendEmployeeInvitation(employeeId: string): Promise<ActionState<TEmployeeAccount>> {
  const t = await getTranslations("setup");

  if (!employeeId) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.sendEmployeeInvitation(employeeId);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("employees.account.errors.invite"));
  }
}

/** Invites the chosen employees; skips the ones who left or already signed in, one result each. */
export async function SendEmployeeInvitations(ids: string[]): Promise<ActionState<TEmployeeBulkInvitation[]>> {
  const t = await getTranslations("setup");

  if (ids.length === 0) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.sendEmployeeInvitations(ids);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("employees.account.errors.invite"));
  }
}

/** Brings an archived employee back to the list, active again (their IAM account too). */
export async function RestoreEmployee(employeeId: string): Promise<ActionState<TEmployeeSaveResult>> {
  const t = await getTranslations("setup");

  if (!employeeId) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.restoreEmployee(employeeId);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("employees.errors.restore"));
  }
}

/* ----------------------------- Career history ----------------------------- */

type EmployeeCareerActionState = ActionState<TEmployeeCareerResult>;

/** Newest `effective_date` first. */
export async function GetEmployeeCareers(employeeId: string): Promise<TEmployeeCareer[]> {
  try {
    const response = await setupService.getEmployeeCareers(employeeId);

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("employees.careers.errors.load")));
  }
}

async function saveEmployeeCareer(formData: FormData | null, isUpdate: boolean): Promise<EmployeeCareerActionState> {
  const t = await getTranslations("setup");

  if (!formData) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = employeeCareerSchema.safeParse({
    id: getText(formData, "id"),
    employee_id: getText(formData, "employee_id"),
    effective_date: getText(formData, "effective_date"),
    employment_type: getText(formData, "employment_type"),
    grade: getText(formData, "grade"),
    position: getText(formData, "position"),
    department_id: getText(formData, "department_id"),
    note: getText(formData, "note"),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, employee_id, ...values } = parsed.data;

  if (isUpdate && !id) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  const payload: TEmployeeCareerPayload = {
    effective_date: values.effective_date,
    employment_type: values.employment_type,
    grade: toNullableGrade(values.grade),
    position: values.position,
    department_id: toNullableId(values.department_id),
    note: values.note || null,
  };

  try {
    const result = isUpdate
      ? await setupService.updateEmployeeCareer(employee_id, id, payload)
      : await setupService.createEmployeeCareer(employee_id, payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, isUpdate ? t("employees.careers.errors.update") : t("employees.careers.errors.create"));
  }
}

/** 422 on `effective_date` when the employee already has a row on that date. */
export async function CreateEmployeeCareer(
  prevState: EmployeeCareerActionState,
  formData: FormData | null,
): Promise<EmployeeCareerActionState> {
  return saveEmployeeCareer(formData, false);
}

export async function UpdateEmployeeCareer(
  prevState: EmployeeCareerActionState,
  formData: FormData | null,
): Promise<EmployeeCareerActionState> {
  return saveEmployeeCareer(formData, true);
}

/** `id` = career row, `employee_id` = its employee. 409 when it is the only row. */
export async function DeleteEmployeeCareer(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = employeeCareerDeleteSchema.safeParse({
    id: getText(formData, "id"),
    employee_id: getText(formData, "employee_id"),
  });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.deleteEmployeeCareer(parsed.data.employee_id, parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("employees.careers.errors.delete"));
  }
}
