"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { appraisalService, type TAppraisalPeriodListParams } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { TAppraisalAnswers, TAppraisalDetail, TAppraisalListParams, TAppraisalListResponse, TAppraisalPeriod } from "@/types/appraisal";
import {
  APPRAISAL_TRANSITIONS,
  appraisalAnswersSchema,
  appraisalIdSchema,
  appraisalReturnSchema,
  type AppraisalReturnSchemaType,
  type TAppraisalTransition,
} from "@/validations/appraisal-validations";

type AppraisalActionState = ActionState<TAppraisalDetail>;

/** Actions shared by the appraisal routes (my, team, reports, periods and the form). */

export async function GetAppraisals(params: TAppraisalListParams): Promise<ActionState<TAppraisalListResponse>> {
  try {
    return { status: "success", data: await appraisalService.getAppraisals(params) };
  } catch (error) {
    return toApiErrorState(error, (await getTranslations("appraisal"))("errors.loadList"));
  }
}

export async function GetAppraisalPeriods(params: TAppraisalPeriodListParams): Promise<ActionState<TApiPaginated<TAppraisalPeriod>>> {
  try {
    return { status: "success", data: await appraisalService.getPeriods(params) };
  } catch (error) {
    return toApiErrorState(error, (await getTranslations("appraisal"))("errors.loadPeriods"));
  }
}

/**
 * `data: null` when the appraisal does not exist or is not mine to see (403/404): the page then goes home.
 * Any other failure comes back as an error state rather than a throw, so its message survives
 * production (read it with `unwrapActionState`).
 */
export async function GetAppraisal(id: string): Promise<ActionState<TAppraisalDetail | null>> {
  try {
    const response = await appraisalService.getAppraisal(id);

    return { status: "success", data: response.data };
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 403 || status === 404) return { status: "success", data: null };

    return toApiErrorState(error, (await getTranslations("appraisal"))("errors.loadDetail"));
  }
}

/** Saves the draft answers; the API keeps only what my role may write and answers with the fresh detail. */
export async function SaveAppraisalAnswers(id: string, answers: TAppraisalAnswers): Promise<AppraisalActionState> {
  const t = await getTranslations("appraisal");
  const parsedId = appraisalIdSchema.safeParse({ id });
  const parsedAnswers = appraisalAnswersSchema.safeParse(answers);

  if (!parsedId.success) return toFormErrorState(t("errors.missingId"));
  if (!parsedAnswers.success) return toFormErrorState(t("errors.invalidAnswers"));

  try {
    const result = await appraisalService.saveAnswers(parsedId.data.id, answers);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.save"));
  }
}

/** submit (employee) · assess (assessor, final). A 422 carries `errors["answers.…"]`. */
export async function TransitionAppraisal(id: string, transition: TAppraisalTransition): Promise<AppraisalActionState> {
  const t = await getTranslations("appraisal");
  const parsed = appraisalIdSchema.safeParse({ id });

  if (!parsed.success || !APPRAISAL_TRANSITIONS.includes(transition)) {
    return toFormErrorState(t("errors.missingId"));
  }

  try {
    const result =
      transition === "submit" ? await appraisalService.submitAppraisal(parsed.data.id) : await appraisalService.assessAppraisal(parsed.data.id);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t(`errors.${transition}`));
  }
}

/** The assessor sends a submitted appraisal back to draft with a note. */
export async function ReturnAppraisal(prevState: AppraisalActionState, values: AppraisalReturnSchemaType | null): Promise<AppraisalActionState> {
  const t = await getTranslations("appraisal");

  if (!values) return toFormErrorState(t("errors.formDataEmpty"));

  const parsed = appraisalReturnSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await appraisalService.returnAppraisal(parsed.data.id, { note: parsed.data.note });

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.return"));
  }
}
