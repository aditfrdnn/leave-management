import type { ActionState } from "@/types/action-state";

/**
 * leave-service answers a failure through `Controller::sendError` (`docs/backend-task.md` §2):
 *
 *   controller error → { success: false, message }
 *   validation (422) → { success: false, message, data: { field: [msg] } }   ← field errors under `data`
 *   framework errors → { message }                                            ← e.g. 401 "Unauthenticated."
 *
 * Laravel's own 422 shape `{ message, errors }` is accepted too, so the helper keeps working
 * once the API moves to the standard key.
 */

type ErrorLike = {
  response?: { status?: number; data?: unknown };
  message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFieldErrors(errors: unknown): Record<string, string[]> {
  if (!isRecord(errors)) return {};

  return Object.entries(errors).reduce<Record<string, string[]>>((accumulator, [field, messages]) => {
    if (Array.isArray(messages)) {
      accumulator[field] = messages.map(String);
    } else if (typeof messages === "string") {
      accumulator[field] = [messages];
    }

    return accumulator;
  }, {});
}

/** The field-error map of a response body, whichever key the API used. */
function extractFieldErrors(body: unknown, status?: number): Record<string, string[]> {
  if (!isRecord(body)) return {};
  if ("errors" in body) return toFieldErrors(body.errors);
  if (status === 422 && body.success === false && isRecord(body.data)) return toFieldErrors(body.data);

  return {};
}

/** Best-effort human-readable message for any thrown value. */
export function toApiErrorMessage(error: unknown, fallbackMessage: string) {
  const body = (error as ErrorLike)?.response?.data;

  if (isRecord(body) && typeof body.message === "string" && body.message) {
    return body.message;
  }

  return (error as ErrorLike)?.message || fallbackMessage;
}

/**
 * Normalises a thrown Axios error into an error `ActionState`.
 *
 * Field-level messages land in `errors` keyed by field name so the form can
 * `setError` them; anything else lands in `errors._form`.
 */
export function toApiErrorState<TData = unknown>(error: unknown, fallbackMessage: string): ActionState<TData> {
  const response = (error as ErrorLike)?.response;
  const message = toApiErrorMessage(error, fallbackMessage);
  const fieldErrors = extractFieldErrors(response?.data, response?.status);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message,
      errors: response?.status === 422 ? fieldErrors : { ...fieldErrors, _form: [message] },
    };
  }

  return {
    status: "error",
    message,
    errors: { _form: [message] },
  };
}

/** Shorthand for failures that never came from the network. */
export function toFormErrorState<TData = unknown>(message: string): ActionState<TData> {
  return {
    status: "error",
    message,
    errors: { _form: [message] },
  };
}
