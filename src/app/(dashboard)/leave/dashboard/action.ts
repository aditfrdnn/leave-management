"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage } from "@/lib/api-error";
import { dashboardService } from "@/services";
import type { TDashboard } from "@/types/dashboard";

/** Every section the signed-in user may see; the API leaves the others null. */
export async function GetDashboard(year: number): Promise<TDashboard> {
  try {
    const response = await dashboardService.getDashboard(year);

    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("dashboard"))("errors.load")));
  }
}
