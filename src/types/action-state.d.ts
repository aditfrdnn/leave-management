export type ActionState<TData = unknown> = {
    status: "idle" | "success" | "error",
    message?: string,
    errors?: Record<string, string[]>,
    data?: TData
}

export type ActionFn = (
    prevState: ActionState,
    formData: FormData
) => Promise<ActionState>