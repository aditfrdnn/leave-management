import { z } from "zod";

import type { TAppraisalTemplatePayload, TTemplateSection } from "@/types/appraisal";

/**
 * Appraisal template schema (docs/appraisal-module.md §2). It drives the editor's `zodResolver` and the
 * save action's `safeParse`. Field paths match the API's 422 keys (`schema.sections.N.items.M.key`), so
 * client and server errors land on the same field. Messages are keys under `setup.appraisalTemplates.validation`.
 */

const V = "setup.appraisalTemplates.validation";

export const SCALE_LENGTH = 5;
export const SECTION_KINDS = ["rating", "kpi_review", "kpi_target", "text"] as const;
export const RATING_AUDIENCES = ["all", "leaders"] as const;
export const TEXT_FILLED_BY = ["employee", "assessor", "both"] as const;

/** Lower-case letters, digits and underscores, starting with a letter: stable ids inside the answers JSON. */
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

const keySchema = z.string().trim().min(1, `${V}.keyRequired`).max(50, `${V}.keyMax`).regex(KEY_PATTERN, `${V}.keyFormat`);
const titleSchema = z.string().trim().min(1, `${V}.titleRequired`).max(255, `${V}.titleMax`);
const instructionsSchema = z.string().max(5000, `${V}.instructionsMax`);

const rowsSchema = z
  .number({ error: `${V}.rowsNumber` })
  .int(`${V}.rowsNumber`)
  .min(1, `${V}.rowsMin`)
  .max(50, `${V}.rowsMax`);

const scaleLevelSchema = z.object({
  value: z.number().int(),
  label: z.string().trim().min(1, `${V}.scaleLabelRequired`).max(100, `${V}.scaleLabelMax`),
});

const scaleSchema = z
  .array(scaleLevelSchema)
  .length(SCALE_LENGTH, `${V}.scaleLength`)
  .superRefine((levels, context) => {
    levels.forEach((level, index) => {
      if (level.value !== index + 1) {
        context.addIssue({ code: "custom", path: [index, "label"], message: `${V}.scaleValues` });
      }
    });
  });

const ratingItemSchema = z.object({
  key: keySchema,
  code: z.string().trim().min(1, `${V}.codeRequired`).max(20, `${V}.itemCodeMax`),
  title: titleSchema,
  points: z.array(z.string().max(1000, `${V}.pointMax`)),
  levels: z.array(z.string().max(2000, `${V}.levelMax`)),
  audience: z.enum(RATING_AUDIENCES),
});

const textFieldSchema = z.object({
  key: keySchema,
  label: z.string().trim().min(1, `${V}.labelRequired`).max(255, `${V}.labelMax`),
  filled_by: z.enum(TEXT_FILLED_BY),
});

/** Adds a "duplicate key" issue to every entry after the first that reuses a key. */
function refineUniqueKeys(entries: { key: string }[], context: z.RefinementCtx, pathPrefix: (string | number)[]) {
  const seen = new Set<string>();

  entries.forEach((entry, index) => {
    const key = entry.key.trim();
    if (!key) return;

    if (seen.has(key)) {
      context.addIssue({ code: "custom", path: [...pathPrefix, index, "key"], message: `${V}.keyDuplicate` });
    }
    seen.add(key);
  });
}

function refineRows(section: { min_rows: number; max_rows: number }, context: z.RefinementCtx) {
  if (Number.isFinite(section.min_rows) && Number.isFinite(section.max_rows) && section.min_rows > section.max_rows) {
    context.addIssue({ code: "custom", path: ["max_rows"], message: `${V}.rowsOrder` });
  }
}

const ratingSectionSchema = z
  .object({
    key: keySchema,
    kind: z.literal("rating"),
    title: titleSchema,
    instructions: instructionsSchema,
    scale: scaleSchema,
    items: z.array(ratingItemSchema).min(1, `${V}.itemsMin`),
  })
  .superRefine((section, context) => {
    refineUniqueKeys(section.items, context, ["items"]);

    section.items.forEach((item, index) => {
      if (item.levels.length !== section.scale.length) {
        context.addIssue({ code: "custom", path: ["items", index, "levels"], message: `${V}.levelsLength` });
      }
    });
  });

const kpiReviewSectionSchema = z
  .object({
    key: keySchema,
    kind: z.literal("kpi_review"),
    title: titleSchema,
    instructions: instructionsSchema,
    scale: scaleSchema,
    min_rows: rowsSchema,
    max_rows: rowsSchema,
  })
  .superRefine(refineRows);

const kpiTargetSectionSchema = z
  .object({
    key: keySchema,
    kind: z.literal("kpi_target"),
    title: titleSchema,
    instructions: instructionsSchema,
    min_rows: rowsSchema,
    max_rows: rowsSchema,
  })
  .superRefine(refineRows);

const textSectionSchema = z
  .object({
    key: keySchema,
    kind: z.literal("text"),
    title: titleSchema,
    instructions: instructionsSchema,
    fields: z.array(textFieldSchema).min(1, `${V}.fieldsMin`),
  })
  .superRefine((section, context) => refineUniqueKeys(section.fields, context, ["fields"]));

export const templateSectionSchema = z.discriminatedUnion("kind", [
  ratingSectionSchema,
  kpiReviewSectionSchema,
  kpiTargetSectionSchema,
  textSectionSchema,
]);

export const appraisalTemplateSchema = z.object({
  code: z.string().trim().min(1, `${V}.codeRequired`).max(50, `${V}.codeMax`),
  name: z.string().trim().min(1, `${V}.nameRequired`).max(255, `${V}.nameMax`),
  revision: z.string().trim().min(1, `${V}.revisionRequired`).max(20, `${V}.revisionMax`),
  is_active: z.boolean(),
  schema: z
    .object({
      title: z.string().trim().min(1, `${V}.formTitleRequired`).max(255, `${V}.titleMax`),
      sections: z.array(templateSectionSchema).min(1, `${V}.sectionsMin`),
    })
    .superRefine((schema, context) => refineUniqueKeys(schema.sections, context, ["sections"])),
});

export type AppraisalTemplateSchemaType = z.infer<typeof appraisalTemplateSchema>;

/** Trims text and drops blank bullet lines; the editor keeps them while typing. */
export function toAppraisalTemplatePayload(values: AppraisalTemplateSchemaType): TAppraisalTemplatePayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    revision: values.revision.trim(),
    is_active: values.is_active,
    schema: {
      title: values.schema.title.trim(),
      sections: values.schema.sections.map((section): TTemplateSection => {
        const base = { key: section.key.trim(), title: section.title.trim(), instructions: section.instructions.trim() };

        switch (section.kind) {
          case "rating":
            return {
              ...base,
              kind: "rating",
              scale: section.scale.map((level, index) => ({ value: index + 1, label: level.label.trim() })),
              items: section.items.map((item) => ({
                key: item.key.trim(),
                code: item.code.trim(),
                title: item.title.trim(),
                points: item.points.map((point) => point.trim()).filter(Boolean),
                levels: item.levels.map((level) => level.trim()),
                audience: item.audience,
              })),
            };
          case "kpi_review":
            return {
              ...base,
              kind: "kpi_review",
              scale: section.scale.map((level, index) => ({ value: index + 1, label: level.label.trim() })),
              min_rows: section.min_rows,
              max_rows: section.max_rows,
            };
          case "kpi_target":
            return { ...base, kind: "kpi_target", min_rows: section.min_rows, max_rows: section.max_rows };
          case "text":
            return {
              ...base,
              kind: "text",
              fields: section.fields.map((field) => ({ key: field.key.trim(), label: field.label.trim(), filled_by: field.filled_by })),
            };
        }
      }),
    },
  };
}

/** "Kekuatan Karyawan" → "kekuatan_karyawan"; used to fill an empty key from its title. */
export function toTemplateKey(text: string) {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  return /^[a-z]/.test(slug) ? slug : slug ? `k_${slug}`.slice(0, 50) : "";
}
