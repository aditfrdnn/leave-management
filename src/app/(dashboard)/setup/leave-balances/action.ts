"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { setupService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { TDepartmentOption, TLeaveBalanceEntry, TLeaveBalanceItem, TLeaveBalanceListParams } from "@/types/setup";
import { leaveBalanceSchema } from "@/validations/setup-validations";

export async function GetLeaveBalances(params: TLeaveBalanceListParams): Promise<ActionState<TApiPaginated<TLeaveBalanceItem>>> {
  try {
    return { status: "success", data: await setupService.getLeaveBalances(params) };
  } catch (error) {
    return toApiErrorState(error, (await getTranslations("setup"))("leaveBalances.errors.loadList"));
  }
}

export async function GetLeaveBalanceEntries(employeeId: string, page: number): Promise<ActionState<TApiPaginated<TLeaveBalanceEntry>>> {
  try {
    return { status: "success", data: await setupService.getLeaveBalanceEntries(employeeId, { page, per_page: 20 }) };
  } catch (error) {
    return toApiErrorState(error, (await getTranslations("setup"))("leaveBalances.errors.loadHistory"));
  }
}

export async function GetDepartmentOptions(): Promise<ActionState<TDepartmentOption[]>> {
  try {
    const response = await setupService.getDepartmentOptions();

    return { status: "success", data: response.data ?? [] };
  } catch (error) {
    return toApiErrorState(error, (await getTranslations("setup"))("shared.errors.loadDepartments"));
  }
}

/** Sets the absolute balance; the API records the difference with the note. */
export async function SetLeaveBalance(
  prevState: ActionState<TLeaveBalanceItem>,
  values: { employee_id: string; balance: number; note: string } | null,
): Promise<ActionState<TLeaveBalanceItem>> {
  const t = await getTranslations("setup");

  if (!values) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = leaveBalanceSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { employee_id, ...payload } = parsed.data;

  try {
    const result = await setupService.setLeaveBalance(employee_id, payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("leaveBalances.errors.save"));
  }
}
