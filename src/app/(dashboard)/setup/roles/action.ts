"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { setupService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { TPermissionGroup, TRoleDetail, TRoleItem, TRoleListParams } from "@/types/setup";
import { roleSchema, setupDeleteSchema } from "@/validations/setup-validations";

type RoleActionState = ActionState<TRoleItem>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function GetRoles(params: TRoleListParams): Promise<TApiPaginated<TRoleItem>> {
  try {
    return await setupService.getRoles(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("roles.errors.loadList")));
  }
}

/** The role with its permissions and the users holding it, for the detail sheet. */
export async function GetRole(id: string): Promise<TRoleDetail> {
  try {
    const response = await setupService.getRole(id);

    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("roles.errors.load")));
  }
}

/** The permission catalog grouped for the role form's checklist. */
export async function GetPermissionGroups(): Promise<TPermissionGroup[]> {
  try {
    const response = await setupService.getPermissionGroups();

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("permissions.errors.loadGroups")));
  }
}

/** `permission_ids` is the complete final set; the API replaces the role's permissions with it. */
async function saveRole(formData: FormData | null, isUpdate: boolean): Promise<RoleActionState> {
  const t = await getTranslations("setup");

  if (!formData) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = roleSchema.safeParse({
    id: getText(formData, "id"),
    title: getText(formData, "title"),
    description: getText(formData, "description"),
    permission_ids: formData.getAll("permission_ids").map(String),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, title, description, permission_ids } = parsed.data;

  if (isUpdate && !id) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  const payload = { title, description: description || null, permission_ids };

  try {
    const result = isUpdate ? await setupService.updateRole(id, payload) : await setupService.createRole(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, isUpdate ? t("roles.errors.update") : t("roles.errors.create"));
  }
}

export async function CreateRole(prevState: RoleActionState, formData: FormData | null): Promise<RoleActionState> {
  return saveRole(formData, false);
}

export async function UpdateRole(prevState: RoleActionState, formData: FormData | null): Promise<RoleActionState> {
  return saveRole(formData, true);
}

/** 409 for system roles and roles that still have users. */
export async function DeleteRole(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = setupDeleteSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.deleteRole(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("roles.errors.delete"));
  }
}
