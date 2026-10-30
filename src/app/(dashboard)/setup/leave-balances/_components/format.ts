/** Leave days: whole numbers plain, halves with one decimal ("8.5"), in the active locale. */
export function formatDays(value: number, locale: string, signed = false) {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value);
}

/** "2026-11" → "Nov 2026". */
export function formatPeriod(period: string | null, locale: string) {
  if (!period) return null;
  const [year, month] = period.split("-").map(Number);

  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", { month: "short", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}
