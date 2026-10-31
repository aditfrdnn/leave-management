import { z } from "zod";

/**
 * Appraisal schemas (docs/appraisal-module.md §3–§5). The period schema drives the dialog's
 * `zodResolver` and the action's `safeParse`; messages are keys under `appraisal.*.validation.*`.
 */

const isoDate = (message: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);

export const appraisalIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/* -------------------------------- Periods -------------------------------- */

export const appraisalPeriodSchema = z
  .object({
    id: z.string().regex(/^\d*$/),
    name: z.string().trim().min(1, "appraisal.periods.validation.nameRequired").max(100, "appraisal.periods.validation.nameMax"),
    review_start: isoDate("appraisal.periods.validation.dateRequired"),
    review_end: isoDate("appraisal.periods.validation.dateRequired"),
    target_start: isoDate("appraisal.periods.validation.dateRequired"),
    target_end: isoDate("appraisal.periods.validation.dateRequired"),
    due_date: z.union([z.literal(""), isoDate("appraisal.periods.validation.dateInvalid")]),
    template_id: z.string().regex(/^\d+$/, "appraisal.periods.validation.templateRequired"),
  })
  // ISO dates compare correctly as strings.
  .refine((value) => value.review_end >= value.review_start, {
    path: ["review_end"],
    message: "appraisal.periods.validation.reviewEndBeforeStart",
  })
  .refine((value) => value.target_end >= value.target_start, {
    path: ["target_end"],
    message: "appraisal.periods.validation.targetEndBeforeStart",
  })
  .refine((value) => value.target_start > value.review_end, {
    path: ["target_start"],
    message: "appraisal.periods.validation.targetBeforeReview",
  });

export type AppraisalPeriodSchemaType = z.infer<typeof appraisalPeriodSchema>;

/* ------------------------------- Appraisals ------------------------------ */

export const appraisalReturnSchema = z.object({
  id: z.number().int().positive(),
  note: z.string().trim().min(1, "appraisal.form.validation.noteRequired").max(1000, "appraisal.form.validation.noteMax"),
});

export type AppraisalReturnSchemaType = z.infer<typeof appraisalReturnSchema>;

const ratingValue = z.number().int().min(1).max(5).nullable();

/** Shape-only check of `answers` before it leaves the server; completeness is the API's job (§4). */
export const appraisalAnswersSchema = z.record(
  z.string(),
  z.union([
    z.array(
      z.object({
        objective: z.string(),
        kpi: z.string(),
        target: z.string(),
        weight: z.number(),
        self: ratingValue.optional(),
        final: ratingValue.optional(),
      }),
    ),
    z.record(z.string(), z.union([z.string(), z.object({ self: ratingValue, final: ratingValue })])),
  ]),
);

export const APPRAISAL_TRANSITIONS = ["submit", "assess"] as const;
export type TAppraisalTransition = (typeof APPRAISAL_TRANSITIONS)[number];
