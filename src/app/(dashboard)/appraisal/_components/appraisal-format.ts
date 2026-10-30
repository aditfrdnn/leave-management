import type { TAppraisalPeriod } from "@/types/appraisal";

/** App locale ("en" | "id") → Intl locale. */
const toIntlLocale = (locale: string) => (locale === "id" ? "id-ID" : "en-GB");

/** `YYYY-MM-DD` read as a local date (avoids the UTC shift of `new Date("2025-08-01")`). */
export function parseIsoDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Date(year, (month || 1) - 1, day || 1);
}

/** "Agustus 2025" / "August 2025". */
export function formatMonthYear(value: string, locale: string) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), { month: "long", year: "numeric" }).format(parseIsoDate(value));
}

/** "1 Agu 2025" / "1 Aug 2025"; "-" without a value. */
export function formatDay(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "numeric", month: "short", year: "numeric" }).format(parseIsoDate(value));
}

type TRangeFormatter = (values: { start: string; end: string }) => string;

/** The review and target ranges of a period, joined by the locale's connector ("s/d"). */
export function periodRanges(period: Pick<TAppraisalPeriod, "review_start" | "review_end" | "target_start" | "target_end">, locale: string, joinRange: TRangeFormatter) {
  return {
    review: joinRange({ start: formatMonthYear(period.review_start, locale), end: formatMonthYear(period.review_end, locale) }),
    target: joinRange({ start: formatMonthYear(period.target_start, locale), end: formatMonthYear(period.target_end, locale) }),
  };
}

/** Replaces `{review_period}` / `{target_period}` in a template title or instruction. */
export function fillPeriodPlaceholders(text: string, ranges: { review: string; target: string }) {
  return text.replaceAll("{review_period}", ranges.review).replaceAll("{target_period}", ranges.target);
}
