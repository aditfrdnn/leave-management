/** React Query keys of the appraisal module; invalidate `APPRAISAL_QUERY_KEY` to refresh everything. */
export const APPRAISAL_QUERY_KEY = ["appraisal"] as const;
export const APPRAISAL_LIST_QUERY_KEY = ["appraisal", "list"] as const;
export const APPRAISAL_PERIODS_QUERY_KEY = ["appraisal", "periods"] as const;
export const APPRAISAL_DETAIL_QUERY_KEY = (id: string) => ["appraisal", "detail", id] as const;

/** Enough to list every period in a select. */
export const PERIOD_OPTIONS_PARAMS = { page: 1, per_page: 100 } as const;
