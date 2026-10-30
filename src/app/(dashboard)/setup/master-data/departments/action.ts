"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { setupService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { TDepartmentItem, TDepartmentListParams } from "@/types/setup";
import { departmentSchema, setupDeleteSchema } from "@/validations/setup-validations";

type DepartmentActionState = ActionState<TDepartmentItem>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function GetDepartments(params: TDepartmentListParams): Promise<TApiPaginated<TDepartmentItem>> {
  try {
    return await setupService.getDepartments(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("departments.errors.loadList")));
  }
}

async function saveDepartment(formData: FormData | null, isUpdate: boolean): Promise<DepartmentActionState> {
  const t = await getTranslations("setup");

  if (!formData) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = departmentSchema.safeParse({
    id: getText(formData, "id"),
    name: getText(formData, "name"),
    alias: getText(formData, "alias"),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, ...payload } = parsed.data;

  if (isUpdate && !id) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = isUpdate ? await setupService.updateDepartment(id, payload) : await setupService.createDepartment(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, isUpdate ? t("departments.errors.update") : t("departments.errors.create"));
  }
}

export async function CreateDepartment(prevState: DepartmentActionState, formData: FormData | null): Promise<DepartmentActionState> {
  return saveDepartment(formData, false);
}

export async function UpdateDepartment(prevState: DepartmentActionState, formData: FormData | null): Promise<DepartmentActionState> {
  return saveDepartment(formData, true);
}

/** 409 while employees or users still reference the department. */
export async function DeleteDepartment(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = setupDeleteSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.deleteDepartment(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("departments.errors.delete"));
  }
}
