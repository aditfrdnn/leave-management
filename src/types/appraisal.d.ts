/** Appraisal module types — contract in docs/appraisal-module.md (§2–§5). */

export type TScaleLevel = { value: number; label: string };

export type TRatingAudience = "all" | "leaders";

export type TRatingItem = {
  /** Stable id inside the section, e.g. "passion". */
  key: string;
  /** Short code shown next to the title, e.g. "PASS". */
  code: string;
  title: string;
  /** Bullet lines under the title. */
  points: string[];
  /** One description per scale level, same order as the section's `scale`. */
  levels: string[];
  audience: TRatingAudience;
};

export type TTextField = { key: string; label: string; filled_by: "employee" | "assessor" | "both" };

export type TTemplateSection =
  | { key: string; kind: "rating"; title: string; instructions: string; scale: TScaleLevel[]; items: TRatingItem[] }
  | { key: string; kind: "kpi_review"; title: string; instructions: string; scale: TScaleLevel[]; min_rows: number; max_rows: number }
  | { key: string; kind: "kpi_target"; title: string; instructions: string; min_rows: number; max_rows: number }
  | { key: string; kind: "text"; title: string; instructions: string; fields: TTextField[] };

export type TTemplateSectionKind = TTemplateSection["kind"];

export type TAppraisalTemplateSchema = { title: string; sections: TTemplateSection[] };

export type TAppraisalTemplateItem = {
  id: number;
  code: string;
  name: string;
  revision: string;
  is_active: boolean;
  periods_count: number;
  updated_at: string;
};

export type TAppraisalTemplate = TAppraisalTemplateItem & { schema: TAppraisalTemplateSchema };

export type TAppraisalTemplatePayload = {
  code: string;
  name: string;
  revision: string;
  is_active: boolean;
  schema: TAppraisalTemplateSchema;
};

export type TAppraisalPeriodStatus = "open" | "closed";

export type TAppraisalStatus = "draft" | "submitted" | "assessed" | "acknowledged";

export type TAppraisalPeriod = {
  id: number;
  name: string;
  /** `YYYY-MM-DD` */
  review_start: string;
  review_end: string;
  target_start: string;
  target_end: string;
  due_date: string | null;
  status: TAppraisalPeriodStatus;
  template: { id: number; code: string; name: string; revision: string };
  closed_at: string | null;
  created_at: string;
  /** Only for `appraisal.view_all` / `appraisal.manage_periods`. */
  counts?: Record<"total" | TAppraisalStatus, number>;
};

export type TAppraisalPeriodPayload = {
  name: string;
  review_start: string;
  review_end: string;
  target_start: string;
  target_end: string;
  due_date: string | null;
  template_id: number;
};

export type TRatingAnswer = { self: number | null; final: number | null };
export type TKpiReviewRow = { objective: string; kpi: string; target: string; weight: number; self: number | null; final: number | null };
export type TKpiTargetRow = { objective: string; kpi: string; target: string; weight: number };

/** Keyed by section key; the value's shape follows the section kind. */
export type TAppraisalAnswers = Record<
  string,
  Record<string, TRatingAnswer> | TKpiReviewRow[] | TKpiTargetRow[] | Record<string, string>
>;

export type TAppraisalItem = {
  id: number;
  status: TAppraisalStatus;
  period: { id: number; name: string; status: TAppraisalPeriodStatus };
  employee: {
    id: number;
    name: string;
    employee_number: string;
    position: string | null;
    department: { id: number; name: string; alias: string } | null;
  };
  assessor: { id: number; name: string } | null;
  submitted_at: string | null;
  assessed_at: string | null;
  acknowledged_at: string | null;
  updated_at: string;
};

export type TAppraisalSnapshot = {
  employee?: { name: string; employee_number: string; position: string | null; department: string | null };
  assessor?: { name: string; position: string | null };
};

export type TAppraisalDetail = Omit<TAppraisalItem, "period"> & {
  answers: TAppraisalAnswers;
  return_note: string | null;
  snapshot: TAppraisalSnapshot | null;
  template: { id: number; code: string; name: string; revision: string; schema: TAppraisalTemplateSchema };
  period: TAppraisalPeriod;
  is_leader: boolean;
  my_role: "employee" | "assessor" | "viewer";
  can_edit: boolean;
  can_submit: boolean;
  can_return: boolean;
  can_assess: boolean;
  can_acknowledge: boolean;
};

export type TAppraisalScope = "mine" | "team" | "all";

export type TAppraisalListParams = {
  scope?: TAppraisalScope;
  page?: number;
  per_page?: number;
  period_id?: number;
  status?: TAppraisalStatus;
  search?: string;
};

export type TAppraisalListResponse = {
  success: boolean;
  message: string;
  data: TAppraisalItem[];
  meta: { pagination: import("./api").TApiPagination; awaiting_my_assessment?: number };
};
