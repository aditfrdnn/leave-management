"use client";

import { useTranslations } from "next-intl";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TAppraisalPeriod } from "@/types/appraisal";

export const ALL_PERIODS = "all";

/** Period filter of the team and report tables; `allowAll` adds "All periods". */
export default function PeriodSelect({
  periods,
  value,
  onChange,
  allowAll,
  disabled,
}: {
  periods: TAppraisalPeriod[];
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("appraisal.list");

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full rounded-lg sm:w-60" aria-label={t("periodLabel")}>
        <SelectValue placeholder={t("periodPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={ALL_PERIODS}>{t("allPeriods")}</SelectItem>}
        {periods.map((period) => (
          <SelectItem key={period.id} value={String(period.id)}>
            {period.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
