type FileLike = File | Blob
type PrimitiveValue = string | number | boolean
type PrimitiveValueOrNullable = PrimitiveValue | null | undefined

function isFileLike(value: unknown): value is FileLike {
    return (
        (typeof File !== "undefined" && value instanceof File) ||
        (typeof Blob !== "undefined" && value instanceof Blob)
    )
}

function isPrimitiveValue(value: unknown): value is PrimitiveValue {
    return (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    )
}

export function isFileLikeArray(
    value: unknown
): value is FileLike[] {
    return (
        Array.isArray(value) &&
        value.every(isFileLike)
    )
}

function appendFileLike(formData: FormData, key: string, file: FileLike) {
    if (typeof File !== "undefined" && file instanceof File) {
        formData.append(key, file, file.name)
        return
    }

    formData.append(key, file)
}

export function appendFileFieldsToFormData<
    TValues extends Record<string, unknown>,
    TKey extends keyof TValues & string
>(
    formData: FormData,
    values: TValues,
    fileFieldKeys: readonly TKey[]
) {
    fileFieldKeys.forEach((key) => {
        const files = values[key]

        if (!isFileLikeArray(files) || files.length === 0)
            return

        files.forEach((file) => {
            appendFileLike(formData, key, file)
        })
    })
}

export function appendPrimitiveFieldsToFormData<
    TValues extends Record<string, unknown>,
    TKey extends keyof TValues & string
>(
    formData: FormData,
    values: TValues,
    primitiveFieldKeys: readonly TKey[]
) {
    primitiveFieldKeys.forEach((key) => {
        const value = values[key] as PrimitiveValueOrNullable
        if (value === null || value === undefined) return
        if (!isPrimitiveValue(value)) return

        formData.append(key, String(value))
    })
}
