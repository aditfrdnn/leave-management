"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState } from "@/lib/api-error";
import { leaveService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TLeave, TLeaveDetail } from "@/types/leave";
import { cancelLeaveSchema } from "@/validations/leave-validations";

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

/** One request with every approval step; read by the detail sheet on both leave pages. */
export async function GetLeaveRequest(id: number | string): Promise<TLeaveDetail> {
  try {
    const response = await leaveService.getLeaveRequest(id);

    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("leave"))("errors.loadDetail")));
  }
}

/** The requester withdraws a request that is still pending. */
export async function CancelLeaveRequest(prevState: ActionState<TLeave>, formData: FormData): Promise<ActionState<TLeave>> {
  const t = await getTranslations("leave");
  const parsed = cancelLeaveSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await leaveService.cancelLeaveRequest(parsed.data.id);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.cancel"));
  }
}
