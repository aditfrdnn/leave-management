"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

/**
 * Translates a message that may be a full message key ("documentBuilder.validation.nameRequired"),
 * as Zod schemas and server actions return. Text that is not a key passes through unchanged.
 */
export function useTranslateMessage() {
    const t = useTranslations();

    return useCallback(
        (message: string | undefined | null) => {
            if (!message) return "";
            return t.has(message as never) ? t(message as never) : message;
        },
        [t],
    );
}
