"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { appraisalService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TAppraisalPeriod, TAppraisalTemplateItem } from "@/types/appraisal";
import { appraisalIdSchema, appraisalPeriodSchema, type AppraisalPeriodSchemaType } from "@/validations/appraisal-validations";

type PeriodActionState = ActionState<TAppraisalPeriod>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

/** Active templates for the period form's select. */
export async function GetActiveTemplates(): Promise<TAppraisalTemplateItem[]> {
  try {
    const response = await appraisalService.getActiveTemplates();

    return (response.data ?? []).filter((template) => template.is_active);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("appraisal"))("periods.errors.loadTemplates")));
  }
}

/** Create when `id` is empty, update otherwise. */
export async function SaveAppraisalPeriod(prevState: PeriodActionState, values: AppraisalPeriodSchemaType | null): Promise<PeriodActionState> {
  const t = await getTranslations("appraisal");

  if (!values) return toFormErrorState(t("errors.formDataEmpty"));

  const parsed = appraisalPeriodSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, due_date, template_id, ...rest } = parsed.data;
  const payload = { ...rest, due_date: due_date || null, template_id };

  try {
    const result = id ? await appraisalService.updatePeriod(id, payload) : await appraisalService.createPeriod(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, id ? t("periods.errors.update") : t("periods.errors.create"));
  }
}

/** Close stops new appraisals and editing; reopen undoes it. */
export async function SetAppraisalPeriodStatus(id: string, status: "close" | "reopen"): Promise<PeriodActionState> {
  const t = await getTranslations("appraisal");
  const parsed = appraisalIdSchema.safeParse({ id });

  if (!parsed.success) return toFormErrorState(t("errors.missingId"));

  try {
    const result = status === "close" ? await appraisalService.closePeriod(parsed.data.id) : await appraisalService.reopenPeriod(parsed.data.id);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, status === "close" ? t("periods.errors.close") : t("periods.errors.reopen"));
  }
}

export async function DeleteAppraisalPeriod(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("appraisal");
  const parsed = appraisalIdSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) return toFormErrorState(t("errors.missingId"));

  try {
    const result = await appraisalService.deletePeriod(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("periods.errors.delete"));
  }
}
