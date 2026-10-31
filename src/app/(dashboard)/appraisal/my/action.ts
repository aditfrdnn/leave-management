"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { appraisalService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TAppraisalDetail } from "@/types/appraisal";
import { appraisalIdSchema } from "@/validations/appraisal-validations";

/** Starts my appraisal in an open period (409 when it exists, 422 when closed or I have no assessor). */
export async function StartAppraisal(periodId: string): Promise<ActionState<TAppraisalDetail>> {
  const t = await getTranslations("appraisal");
  const parsed = appraisalIdSchema.safeParse({ id: periodId });

  if (!parsed.success) return toFormErrorState(t("errors.missingId"));

  try {
    const result = await appraisalService.createAppraisal(parsed.data.id);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.start"));
  }
}
