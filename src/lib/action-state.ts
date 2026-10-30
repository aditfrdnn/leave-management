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
