"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { leaveService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated, TDropdownOption } from "@/types/api";
import type { TApprover, TLeave, TLeaveListParams } from "@/types/leave";
import { leaveRequestSchema } from "@/validations/leave-validations";

type LeaveActionState = ActionState<TLeave>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function GetLeaveRequests(params: TLeaveListParams): Promise<TApiPaginated<TLeave>> {
  try {
    return await leaveService.getLeaveRequests(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("leave"))("errors.loadList")));
  }
}

export async function GetLeaveTypes(): Promise<TDropdownOption[]> {
  try {
    const response = await leaveService.getLeaveTypes();

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("leave"))("errors.loadLeaveTypes")));
  }
}

export async function GetApprovers(): Promise<TApprover[]> {
  try {
    const response = await leaveService.getApprovers();

    return response.data ?? [];
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("leave"))("errors.loadApprovers")));
  }
}

export async function CreateLeaveRequest(prevState: LeaveActionState, formData: FormData | null): Promise<LeaveActionState> {
  const t = await getTranslations("leave");

  if (!formData) {
    return toFormErrorState(t("errors.formDataEmpty"));
  }

  const parsed = leaveRequestSchema.safeParse({
    subject: getText(formData, "subject"),
    leave_type: getText(formData, "leave_type"),
    leave_date: formData.getAll("leave_date").filter((value): value is string => typeof value === "string"),
    approval_user: getText(formData, "approval_user"),
    reason: getText(formData, "reason"),
    location_during_leave: getText(formData, "location_during_leave"),
    return_to_office: getText(formData, "return_to_office"),
    ongoing_task: getText(formData, "ongoing_task"),
    temporary_replacement: getText(formData, "temporary_replacement"),
    phone_number: getText(formData, "phone_number"),
  });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await leaveService.createLeaveRequest(parsed.data);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.create"));
  }
}
