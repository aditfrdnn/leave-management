"use server";

import { getTranslations } from "next-intl/server";

import { toApiErrorMessage, toApiErrorState, toFormErrorState } from "@/lib/api-error";
import { appraisalTemplateService, type TAppraisalTemplateListParams } from "@/services";
import type { ActionState } from "@/types/action-state";
import type { TApiPaginated } from "@/types/api";
import type { TAppraisalTemplate, TAppraisalTemplateItem, TAppraisalTemplatePayload } from "@/types/appraisal";
import { appraisalTemplateSchema, SCALE_LENGTH, toAppraisalTemplatePayload } from "@/validations/appraisal-template-validations";
import { setupDeleteSchema } from "@/validations/setup-validations";

type TemplateActionState = ActionState<TAppraisalTemplate>;

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function GetAppraisalTemplates(params: TAppraisalTemplateListParams): Promise<TApiPaginated<TAppraisalTemplateItem>> {
  try {
    return await appraisalTemplateService.getAppraisalTemplates(params);
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("appraisalTemplates.errors.loadList")));
  }
}

export async function GetAppraisalTemplate(id: number): Promise<TAppraisalTemplate> {
  try {
    const response = await appraisalTemplateService.getAppraisalTemplate(id);

    return response.data;
  } catch (error) {
    throw new Error(toApiErrorMessage(error, (await getTranslations("setup"))("appraisalTemplates.errors.load")));
  }
}

/**
 * The template travels as one JSON field (`payload`) because its schema is nested; `id` empty = create.
 * Zod issues come back keyed by their dotted path (`schema.sections.0.items.1.key`), the same keys the API's 422 uses.
 */
export async function SaveAppraisalTemplate(prevState: TemplateActionState, formData: FormData | null): Promise<TemplateActionState> {
  const t = await getTranslations("setup");

  if (!formData) {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const id = getText(formData, "id");
  let raw: unknown;

  try {
    raw = JSON.parse(getText(formData, "payload"));
  } catch {
    return toFormErrorState(t("shared.errors.formDataEmpty"));
  }

  const parsed = appraisalTemplateSchema.safeParse(raw);

  if (!parsed.success) {
    const errors = parsed.error.issues.reduce<Record<string, string[]>>((accumulator, issue) => {
      const path = issue.path.join(".") || "_form";
      accumulator[path] = [...(accumulator[path] ?? []), issue.message];

      return accumulator;
    }, {});

    return { status: "error", message: t("appraisalTemplates.errors.invalid"), errors };
  }

  const payload = toAppraisalTemplatePayload(parsed.data);

  try {
    const result = id
      ? await appraisalTemplateService.updateAppraisalTemplate(id, payload)
      : await appraisalTemplateService.createAppraisalTemplate(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, id ? t("appraisalTemplates.errors.update") : t("appraisalTemplates.errors.create"));
  }
}

/** "New template": an inactive draft with one rating section on a 5-level scale and one item, opened right after. */
export async function CreateAppraisalTemplateDraft(): Promise<TemplateActionState> {
  const t = await getTranslations("setup.appraisalTemplates");
  const scale = Array.from({ length: SCALE_LENGTH }, (_, index) => ({
    value: index + 1,
    label: t(`defaults.scale.${index + 1}` as "defaults.scale.1"),
  }));

  const payload: TAppraisalTemplatePayload = {
    code: t("defaults.code"),
    name: t("defaults.name"),
    revision: t("defaults.revision"),
    is_active: false,
    schema: {
      title: t("defaults.formTitle"),
      sections: [
        {
          key: "section_1",
          kind: "rating",
          title: t("defaults.sectionTitle"),
          instructions: "",
          scale,
          items: [
            {
              key: "item_1",
              code: t("defaults.itemCode"),
              title: t("defaults.itemTitle"),
              points: [],
              levels: Array.from({ length: SCALE_LENGTH }, () => ""),
              audience: "all",
            },
          ],
        },
      ],
    },
  };

  try {
    const result = await appraisalTemplateService.createAppraisalTemplate(payload);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("errors.create"));
  }
}

export async function DuplicateAppraisalTemplate(id: number): Promise<TemplateActionState> {
  const t = await getTranslations("setup");

  if (!Number.isInteger(id) || id <= 0) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await appraisalTemplateService.duplicateAppraisalTemplate(id);

    return { status: "success", message: result.message, data: result.data };
  } catch (error) {
    return toApiErrorState(error, t("appraisalTemplates.errors.duplicate"));
  }
}

/** 409 when a period uses the template. */
export async function DeleteAppraisalTemplate(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const t = await getTranslations("setup");
  const parsed = setupDeleteSchema.safeParse({ id: getText(formData, "id") });

  if (!parsed.success) {
    return toFormErrorState(t("shared.errors.missingId"));
  }

  try {
    const result = await appraisalTemplateService.deleteAppraisalTemplate(parsed.data.id);

    return { status: "success", message: result.message };
  } catch (error) {
    return toApiErrorState(error, t("appraisalTemplates.errors.delete"));
  }
}
