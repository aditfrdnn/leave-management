"use client";

import { useLocale } from "next-intl";
import { enUS, id } from "date-fns/locale";

/** date-fns locale for the active language: `format(date, "PP", { locale: dateLocale })`. */
export function useDateLocale() {
    return useLocale() === "id" ? id : enUS;
}
