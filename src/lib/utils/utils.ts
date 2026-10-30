import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** App locale ("en" | "id") → Intl locale. English keeps the day-month-year order. */
function toIntlLocale(locale: string) {
  return locale === "id" ? "id-ID" : "en-GB";
}

/** Pass the UI locale (`useLocale()`) for display; without it the output stays English. */
export function dateFormatter(dateString?: string | null, locale = "en"): string {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

export function dateTimeFormatter(dateString?: string | null, locale = "en"): string {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

/** `YYYY-MM-DD` in the local timezone, the shape the API's date params expect. */
export function toApiDate(date: Date | undefined | null): string {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Task status → CSS color, for the Gantt bars (`components/kibo-ui/gantt`). */
export const getStatusColor = (status: string) => {
  switch (status) {
    case "In Progress":
    case "On Going":
      return "var(--yellow)";
    case "Completed":
      return "var(--green)";
    case "Planned":
    case "To Do":
    default:
      return "var(--base-neutral)";
  }
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
