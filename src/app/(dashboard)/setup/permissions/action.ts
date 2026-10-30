"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { setupService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { TPermissionGroup, TPermissionItem, TPermissionListParams } from "@/types/setup";
import { permissionSchema, setupDeleteSchema } from "@/validations/setup-validations";

type PermissionActionState = ActionState<TPermissionItem>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function GetPermissions(params: TPermissionListParams): Promise<TApiPaginated<TPermissionItem>> {
  try {
    return await setupService.getPermissions(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("permissions.errors.loadList")));
  }
}

/** The group filter's options. */
export async function GetPermissionGroups(): Promise<TPermissionGroup[]> {
  try {
    const response = await setupService.getPermissionGroups();

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("permissions.errors.loadGroups")));
  }
}

/** System rows keep their title: the API only applies `label` and `group_name` to them. */
async function savePermission(formData: FormData | null, isUpdate: boolean): Promise<PermissionActionState> {
  const t = await getTranslations("setup");

  if (!formData) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = permissionSchema.safeParse({
    id: getText(formData, "id"),
    title: getText(formData, "title"),
    label: getText(formData, "label"),
    group_name: getText(formData, "group_name"),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, ...payload } = parsed.data;

  if (isUpdate && !id) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = isUpdate ? await setupService.updatePermission(id, payload) : await setupService.createPermission(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, isUpdate ? t("permissions.errors.update") : t("permissions.errors.create"));
  }
}

export async function CreatePermission(prevState: PermissionActionState, formData: FormData | null): Promise<PermissionActionState> {
  return savePermission(formData, false);
}

export async function UpdatePermission(prevState: PermissionActionState, formData: FormData | null): Promise<PermissionActionState> {
  return savePermission(formData, true);
}

/** 409 for system rows and rows still attached to a role. */
export async function DeletePermission(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = setupDeleteSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.deletePermission(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("permissions.errors.delete"));
  }
}
