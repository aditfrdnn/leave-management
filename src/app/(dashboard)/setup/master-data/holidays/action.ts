"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { setupService } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { THolidayItem, THolidayListParams } from "@/types/setup";
import { holidaySchema, setupDeleteSchema, type HolidaySchemaType } from "@/validations/setup-validations";

type HolidayActionState = ActionState<THolidayItem>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function GetHolidays(params: THolidayListParams): Promise<TApiPaginated<THolidayItem>> {
  try {
    return await setupService.getHolidays(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("holidays.errors.loadList")));
  }
}

/** Create when `id` is empty, update otherwise. */
export async function SaveHoliday(prevState: HolidayActionState, values: HolidaySchemaType | null): Promise<HolidayActionState> {
  const t = await getTranslations("setup");

  if (!values) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = holidaySchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", errors: parsed.error.flatten().fieldErrors };
  }

  const { id, description, ...rest } = parsed.data;
  const payload = { ...rest, description: description || null };

  try {
    const result = id ? await setupService.updateHoliday(id, payload) : await setupService.createHoliday(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, id ? t("holidays.errors.update") : t("holidays.errors.create"));
  }
}

export async function DeleteHoliday(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = setupDeleteSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await setupService.deleteHoliday(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("holidays.errors.delete"));
  }
}
