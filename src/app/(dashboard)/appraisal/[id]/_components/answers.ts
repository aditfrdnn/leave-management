import type {
  TAppraisalAnswers,
  TAppraisalDetail,
  TAppraisalStatus,
  TKpiReviewRow,
  TKpiTargetRow,
  TRatingAnswer,
  TRatingItem,
  TTemplateSection,
} from "@/types/appraisal";

/** Inline errors keyed by the answer path without the `answers.` prefix: `"key_behaviors.passion.self"`. */
export type TAnswerErrors = Record<string, string>;

export type TRatingSection = Extract<TTemplateSection, { kind: "rating" }>;
export type TKpiReviewSection = Extract<TTemplateSection, { kind: "kpi_review" }>;
export type TKpiTargetSection = Extract<TTemplateSection, { kind: "kpi_target" }>;
export type TTextSection = Extract<TTemplateSection, { kind: "text" }>;
export type TKpiRow = TKpiReviewRow | TKpiTargetRow;

const STATUS_RANK: Record<TAppraisalStatus, number> = { draft: 0, submitted: 1, assessed: 2 };

/** True once the appraisal reached `status` (draft < submitted < assessed). */
export const hasReached = (current: TAppraisalStatus, status: TAppraisalStatus) => STATUS_RANK[current] >= STATUS_RANK[status];

export const isApplicable = (item: TRatingItem, isLeader: boolean) => item.audience !== "leaders" || isLeader;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const toRating = (value: unknown) => (typeof value === "number" && value >= 1 && value <= 5 ? value : null);
const toText = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));
const toWeight = (value: unknown) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

export function emptyKpiRow(withRatings: true): TKpiReviewRow;
export function emptyKpiRow(withRatings: false): TKpiTargetRow;
export function emptyKpiRow(withRatings: boolean): TKpiRow {
  const row = { objective: "", kpi: "", target: "", weight: 0 };

  return withRatings ? { ...row, self: null, final: null } : row;
}

function toKpiRows(value: unknown, withRatings: boolean, minRows: number): TKpiRow[] {
  const rows: TKpiRow[] = (Array.isArray(value) ? value : []).filter(isRecord).map((row) => {
    const base = { objective: toText(row.objective), kpi: toText(row.kpi), target: toText(row.target), weight: toWeight(row.weight) };

    return withRatings ? { ...base, self: toRating(row.self), final: toRating(row.final) } : base;
  });

  // An editable form starts with the minimum number of blank rows so there is something to fill.
  while (rows.length < minRows) rows.push(withRatings ? emptyKpiRow(true) : emptyKpiRow(false));

  return rows;
}

/**
 * A complete answers object for the template: every section, every item, every field, so the
 * inputs are controlled from the first render. Unknown keys from the API are dropped.
 */
export function normalizeAnswers(detail: TAppraisalDetail): TAppraisalAnswers {
  const source = isRecord(detail.answers) ? detail.answers : {};
  const answers: TAppraisalAnswers = {};

  for (const section of detail.template.schema.sections) {
    const value = (source as Record<string, unknown>)[section.key];

    switch (section.kind) {
      case "rating": {
        const ratings: Record<string, TRatingAnswer> = {};
        for (const item of section.items) {
          const answer = isRecord(value) && isRecord(value[item.key]) ? (value[item.key] as Record<string, unknown>) : {};
          ratings[item.key] = { self: toRating(answer.self), final: toRating(answer.final) };
        }
        answers[section.key] = ratings;
        break;
      }
      case "kpi_review":
      case "kpi_target":
        answers[section.key] = toKpiRows(value, section.kind === "kpi_review", detail.can_edit ? kpiMinRows(section, detail.my_role) : 0) as
          | TKpiReviewRow[]
          | TKpiTargetRow[];
        break;
      case "text": {
        const texts: Record<string, string> = {};
        for (const field of section.fields) texts[field.key] = toText(isRecord(value) ? value[field.key] : "");
        answers[section.key] = texts;
        break;
      }
    }
  }

  return answers;
}

/**
 * The rows a KPI section needs from this role. The employee only proposes targets (IV.B is
 * optional on submit, §4), so for them kpi_target may stay empty; the assessor needs `min_rows`.
 */
export function kpiMinRows(section: TKpiReviewSection | TKpiTargetSection, role: TAppraisalDetail["my_role"]) {
  return section.kind === "kpi_target" && role !== "assessor" ? 0 : section.min_rows;
}

export const weightTotal = (rows: TKpiRow[]) => rows.reduce((total, row) => total + (Number(row.weight) || 0), 0);

/** `errors["answers.<section>.<item|index>.<field>"]` → `{ "<section>.<item|index>.<field>": message }`. */
export function toAnswerErrors(errors: Record<string, string[]> | undefined): TAnswerErrors {
  return Object.entries(errors ?? {}).reduce<TAnswerErrors>((accumulator, [key, messages]) => {
    if (key === "_form" || !messages?.length) return accumulator;
    accumulator[key.replace(/^answers\./, "")] = messages[0];

    return accumulator;
  }, {});
}

/** Messages of a section that no item, row or field claims (row counts, weight totals…). */
export function looseSectionErrors(errors: TAnswerErrors, sectionKey: string, isClaimed: (head: string) => boolean): string[] {
  return Object.entries(errors)
    .filter(([key]) => key === sectionKey || (key.startsWith(`${sectionKey}.`) && !isClaimed(key.slice(sectionKey.length + 1).split(".")[0])))
    .map(([, message]) => message);
}

/** Scrolls to the first inline error once React has painted it. */
export function scrollToFirstError() {
  window.setTimeout(() => {
    const first = document.querySelector<HTMLElement>("[data-appraisal-error]");
    if (!first) return;

    first.scrollIntoView({ behavior: "smooth", block: "center" });
    first.closest<HTMLElement>("[data-appraisal-field]")?.querySelector<HTMLElement>("input, textarea, [role=radio][tabindex='0']")?.focus({ preventScroll: true });
  }, 50);
}
