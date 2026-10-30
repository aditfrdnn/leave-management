import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { messages, type Messages } from "./messages";

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fills keys missing from `override` with `base`, so an untranslated key shows English. */
function withFallback(base: Record<string, unknown>, override: unknown): Record<string, unknown> {
    if (!isPlainObject(override)) return base;

    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
        merged[key] = isPlainObject(value) && isPlainObject(base[key]) ? withFallback(base[key], value) : value;
    }
    return merged;
}

/** First visit: follow the browser language when it is Indonesian, otherwise the default. */
async function resolveLocale(): Promise<Locale> {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(cookieLocale)) return cookieLocale;

    const acceptLanguage = (await headers()).get("accept-language") ?? "";
    return /^id\b|,\s*id\b/i.test(acceptLanguage) ? "id" : defaultLocale;
}

export default getRequestConfig(async () => {
    const locale = await resolveLocale();

    return {
        locale,
        messages: (locale === defaultLocale
            ? messages.en
            : withFallback(messages.en, messages[locale])) as Messages,
        timeZone: "Asia/Jakarta",
    };
});
