/**
 * Leave API response envelope as the frontend reads it: `{ success?, message?, data }`.
 * Lists come back as plain arrays in `data` (no paginator yet — docs/backend-task.md §4).
 */
export type TApiResponse<TData> = {
  success?: boolean;
  message?: string;
  data: TData;
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
