import type { ActionState } from "@/types/action-state";
import type { TValidationErrorBody } from "@/types/api";

/**
 * The API answers a failure in one of two shapes (`docs/backend-task.md`):
 *
 *   controller error → { success: false, message }
 *   validation (422) → { message, errors }        ← no `success` key
 *
 * Everything here exists so a Server Action can turn either one into the single
 * `ActionState` shape the forms already understand.
 */

type ErrorLike = {
    response?: { status?: number; data?: unknown };
    message?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/** A 422 body is recognised by having `errors` but no `success`. */
export function isValidationErrorBody(
    body: unknown,
): body is TValidationErrorBody {
    return isRecord(body) && !("success" in body) && "errors" in body;
}

function toFieldErrors(errors: unknown): Record<string, string[]> {
    if (!isRecord(errors)) return {};

    return Object.entries(errors).reduce<Record<string, string[]>>(
        (accumulator, [field, messages]) => {
            if (Array.isArray(messages)) {
                accumulator[field] = messages.map(String);
            } else if (typeof messages === "string") {
                accumulator[field] = [messages];
            }

            return accumulator;
        },
        {},
    );
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
export function toApiErrorState<TData = unknown>(
    error: unknown,
    fallbackMessage: string,
): ActionState<TData> {
    const body = (error as ErrorLike)?.response?.data;
    const message = toApiErrorMessage(error, fallbackMessage);

    if (isValidationErrorBody(body)) {
        return {
            status: "error",
            message,
            errors: toFieldErrors(body.errors),
        };
    }

    if (isRecord(body) && "errors" in body) {
        return {
            status: "error",
            message,
            errors: { ...toFieldErrors(body.errors), _form: [message] },
        };
    }

    return {
        status: "error",
        message,
        errors: { _form: [message] },
    };
}

/** Shorthand for failures that never came from the network. */
export function toFormErrorState<TData = unknown>(
    message: string,
): ActionState<TData> {
    return {
        status: "error",
        message,
        errors: { _form: [message] },
    };
}
