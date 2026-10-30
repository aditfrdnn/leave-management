"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { setupService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { TEmployeeOption, TEmployeeOptionParams, TOption, TUserItem, TUserListParams, TUserPayload } from "@/types/setup";
import { setupDeleteSchema, userSchema } from "@/validations/setup-validations";

type UserActionState = ActionState<TUserItem>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function GetUsers(params: TUserListParams): Promise<TApiPaginated<TUserItem>> {
  try {
    return await setupService.getUsers(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("users.errors.loadList")));
  }
}

export async function GetRoleOptions(): Promise<TOption[]> {
  try {
    const response = await setupService.getRoleOptions();

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("shared.errors.loadRoles")));
  }
}

/** Employees without an account, plus `include_id` (the one already linked to the edited user). */
export async function GetEmployeeOptions(params: TEmployeeOptionParams): Promise<TEmployeeOption[]> {
  try {
    const response = await setupService.getEmployeeOptions(params);

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("shared.errors.loadEmployees")));
  }
}

/**
 * `password_confirmation` is only checked here and in the dialog; the API gets `password` alone,
 * and on update only when it was filled in.
 */
async function saveUser(formData: FormData | null, isUpdate: boolean): Promise<UserActionState> {
  const t = await getTranslations("setup");

  if (!formData) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = userSchema.safeParse({
    id: getText(formData, "id"),
    name: getText(formData, "name"),
    email: getText(formData, "email"),
    password: getText(formData, "password"),
    password_confirmation: getText(formData, "password_confirmation"),
    role_id: getText(formData, "role_id"),
    employee_id: getText(formData, "employee_id"),
    is_active: getText(formData, "is_active") === "1",
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, name, email, password, role_id, employee_id, is_active } = parsed.data;

  if (isUpdate && !id) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  const payload: TUserPayload = {
    name,
    email,
    role_id: Number(role_id),
    employee_id: employee_id ? Number(employee_id) : null,
    status: is_active ? "active" : "inactive",
    ...(password ? { password } : {}),
  };

  try {
    const result = isUpdate ? await setupService.updateUser(id, payload) : await setupService.createUser(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    const state = toApiErrorState<TUserItem>(error, isUpdate ? t("users.errors.update") : t("users.errors.create"));

    // The dialog edits `is_active`; the API validates `status`.
    if (state.errors?.status) {
      state.errors = { ...state.errors, is_active: state.errors.status };
    }

    return state;
  }
}

export async function CreateUser(prevState: UserActionState, formData: FormData | null): Promise<UserActionState> {
  return saveUser(formData, false);
}

export async function UpdateUser(prevState: UserActionState, formData: FormData | null): Promise<UserActionState> {
  return saveUser(formData, true);
}

/** 409 when the user already has leave requests or approvals: deactivate instead. */
export async function DeleteUser(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = setupDeleteSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.deleteUser(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("users.errors.delete"));
  }
}
