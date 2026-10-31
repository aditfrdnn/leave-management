/**
 * Leave API response envelope as the frontend reads it: `{ success?, message?, data }`.
 * Lists come back as plain arrays in `data` (no paginator yet — docs/backend-task.md §4).
 */
export type TApiResponse<TData> = {
  success?: boolean;
  message?: string;
  data: TData;
};

/** `Controller::sendPaginated` → `meta.pagination`. */
export type TApiPagination = {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
  has_more: boolean;
  next_page: number | null;
};

export type TApiPaginated<TItem> = {
  success: boolean;
  message: string;
  data: TItem[];
  /** `facets`: header filter values with counts (docs/data-table.md). */
  meta: { pagination: TApiPagination; facets?: import("./table").TTableFacets };
};

/** Laravel's own 422 body — note the missing `success` key. */
export type TValidationErrorBody = {
  message: string;
  errors: Record<string, string[]>;
};

/** select2-style option returned by the `/api/dropdown/*` endpoints. */
export type TDropdownOption = {
  id: number;
  text: string;
};
