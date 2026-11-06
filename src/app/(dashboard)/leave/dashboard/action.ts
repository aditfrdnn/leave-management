"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorState } from "@/lib/api-error";
import type { ActionState } from "@/types/action-state";
import { dashboardService } from "@/services";
import type { TDashboard } from "@/types/dashboard";

/** Every section the signed-in user may see; the API leaves the others null. */
export async function GetDashboard(year: number): Promise<ActionState<TDashboard>> {
  try {
    const response = await dashboardService.getDashboard(year);

    return { status: "success", data: response.data };
  } catch (error) {
    return toApiErrorState(error, (await getTranslations("dashboard"))("errors.load"));
  }
}
