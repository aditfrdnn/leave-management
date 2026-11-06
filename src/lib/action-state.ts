import type { ActionState } from "@/types/action-state";

/**
 * Server Actions return their failures as a value. When a mutation rethrows that
 * value so react-query's error path handles it, the caught error is `unknown` —
 * this narrows it back to the shared `ActionState` shape.
 */
export function isActionState<TData = unknown>(
    value: unknown,
): value is ActionState<TData> {
    return typeof value === "object" && value !== null && "status" in value;
}

/**
 * Next.js hides the message of an error thrown inside a Server Action in production
 * (React error #441), so a read action returns its failure as an `ActionState` instead.
 * A react-query `queryFn` calls this on the client to turn that failure back into a
 * thrown `Error` whose message the error screens can show.
 */
export function unwrapActionState<TData>(state: ActionState<TData>, fallbackMessage = "Request failed"): TData {
    if (state.status === "error") {
        throw new Error(state.message || state.errors?._form?.[0] || fallbackMessage);
    }

    return state.data as TData;
}
